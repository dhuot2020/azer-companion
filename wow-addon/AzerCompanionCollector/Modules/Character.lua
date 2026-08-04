local addonName, Collector = ...
local Module = {}

local function captureProfile(character)
    local className, classFile, classID = UnitClass("player")
    local raceName, raceFile, raceID = UnitRace("player")
    local faction, localizedFaction = UnitFactionGroup("player")
    local specializationIndex = GetSpecialization and GetSpecialization()
    local specializationID
    local specializationName
    local specializationRole

    if specializationIndex and GetSpecializationInfo then
        specializationID, specializationName, _, _, specializationRole = GetSpecializationInfo(specializationIndex)
    end

    local averageItemLevel
    local equippedItemLevel
    local pvpItemLevel
    if GetAverageItemLevel then
        averageItemLevel, equippedItemLevel, pvpItemLevel = GetAverageItemLevel()
    end

    local sexID = UnitSex("player")
    local sexSlug = sexID == 3 and "female" or (sexID == 2 and "male" or "unknown")
    local raceSlug = string.lower(tostring(raceFile or raceName or "unknown")):gsub("[^%w]", "")
    local classSlug = string.lower(tostring(classFile or className or "unknown")):gsub("[^%w]", "")
    local displayID = UnitCreatureDisplayID and UnitCreatureDisplayID("player") or nil

    character.appearance = {
        raceID = raceID,
        raceName = raceName,
        raceFile = raceFile,
        raceSlug = raceSlug,
        classID = classID,
        className = className,
        classFile = classFile,
        classSlug = classSlug,
        sexID = sexID,
        sex = sexSlug,
        faction = faction,
        displayID = displayID,
        portraitKey = table.concat({ raceSlug, sexSlug, classSlug }, "_"),
        portraitSlug = table.concat({ raceSlug, sexSlug, classSlug }, "-"),
        capturedAt = Collector.Utils.Now(),
    }

    character.profile = {
        level = UnitLevel("player"),
        classID = classID,
        className = className,
        classFile = classFile,
        raceID = raceID,
        raceName = raceName,
        raceFile = raceFile,
        faction = faction,
        localizedFaction = localizedFaction,
        sex = sexID,
        specializationID = specializationID,
        specializationName = specializationName,
        specializationRole = specializationRole,
        averageItemLevel = averageItemLevel,
        equippedItemLevel = equippedItemLevel,
        pvpItemLevel = pvpItemLevel,
        money = GetMoney and GetMoney() or nil,
        capturedAt = Collector.Utils.Now(),
    }

    character.lastSeenAt = Collector.Utils.Now()
    AzerCompanionDB.account.updatedAt = Collector.Utils.Now()
end

local function captureProfessions(character)
    if not GetProfessions or not GetProfessionInfo then
        return
    end

    local primary1, primary2, archaeology, fishing, cooking = GetProfessions()
    local professions = {}
    local candidates = {
        { primary1, "primary" },
        { primary2, "primary" },
        { archaeology, "secondary" },
        { fishing, "secondary" },
        { cooking, "secondary" },
    }

    for _, candidate in ipairs(candidates) do
        if candidate[1] then
            local name, icon, skillLevel, maxSkillLevel, _, _, skillLine, skillModifier = GetProfessionInfo(candidate[1])
            if name then
                table.insert(professions, {
                    category = candidate[2],
                    name = name,
                    icon = icon,
                    skillLevel = skillLevel,
                    maxSkillLevel = maxSkillLevel,
                    skillLine = skillLine,
                    skillModifier = skillModifier,
                })
            end
        end
    end

    character.professions = professions
    character.professionsCapturedAt = Collector.Utils.Now()
end

local function captureLocation(character)
    local mapID = C_Map and C_Map.GetBestMapForUnit and C_Map.GetBestMapForUnit("player") or nil
    local x
    local y

    if mapID and C_Map and C_Map.GetPlayerMapPosition then
        local position = C_Map.GetPlayerMapPosition(mapID, "player")
        if position and position.GetXY then
            x, y = position:GetXY()
        end
    end

    character.location = {
        zone = GetZoneText and GetZoneText() or nil,
        realZone = GetRealZoneText and GetRealZoneText() or nil,
        subZone = GetSubZoneText and GetSubZoneText() or nil,
        mapID = mapID,
        x = x,
        y = y,
        capturedAt = Collector.Utils.Now(),
    }
end

function Module:Scan(_, done)
    local character = Collector:GetCurrentCharacter()
    if not character then
        done({ ok = false, error = "Personnage indisponible" })
        return
    end

    captureProfile(character)
    captureProfessions(character)
    captureLocation(character)
    local verification = Collector:RecordCharacterWrite("character-module", character, Collector.Utils.PlayerIdentity())
    done({ ok = true, characterKey = character.key, storageKey = character.storageKey, verified = verification and verification.entryExists or false })
end

function Module:OnEvent(event)
    if event == "PLAYER_LOGIN" or event == "PLAYER_ENTERING_WORLD" then
        local character = Collector:GetCurrentCharacter()
        if character then
            captureProfile(character)
            captureProfessions(character)
            captureLocation(character)
            character.lastLoginAt = character.lastLoginAt or Collector.Utils.Now()
            character.online = true
            Collector:RecordCharacterWrite("player-login", character, Collector.Utils.PlayerIdentity())
        end
    elseif event == "PLAYER_LOGOUT" then
        local character = Collector:GetCurrentCharacter()
        if character then
            character.lastLogoutAt = Collector.Utils.Now()
            character.lastSeenAt = Collector.Utils.Now()
            character.online = false
            Collector:RecordCharacterWrite("player-logout", character, Collector.Utils.PlayerIdentity())
        end
    elseif event == "ZONE_CHANGED" or event == "ZONE_CHANGED_INDOORS" or event == "ZONE_CHANGED_NEW_AREA" then
        local character = Collector:GetCurrentCharacter()
        if character then
            captureLocation(character)
        end
    elseif event == "PLAYER_LEVEL_UP" or event == "PLAYER_SPECIALIZATION_CHANGED" or event == "PLAYER_EQUIPMENT_CHANGED" or event == "SKILL_LINES_CHANGED" or event == "PLAYER_MONEY" then
        local character = Collector:GetCurrentCharacter()
        if character then
            captureProfile(character)
            captureProfessions(character)
        end
    end
end

Collector:RegisterModule("Character", Module)
