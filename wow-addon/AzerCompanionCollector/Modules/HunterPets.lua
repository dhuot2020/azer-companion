local addonName, Collector = ...
local Module = {}

local HUNTER_CLASS_ID = 3

local function safeCall(fn, ...)
    if type(fn) ~= "function" then return nil end
    local ok, a, b, c, d, e, f, g, h, i, j = pcall(fn, ...)
    if not ok then return nil end
    return a, b, c, d, e, f, g, h, i, j
end

local function getClassID(character)
    local classID = tonumber(character and character.profile and character.profile.classID)
    if classID then return classID end
    local _, _, unitClassID = safeCall(UnitClass, "player")
    return tonumber(unitClassID)
end

local function normalizePetInfo(info, source)
    if type(info) ~= "table" then return nil end
    local creatureID = tonumber(info.creatureID)
    if not creatureID or creatureID <= 0 then return nil end
    return {
        creatureID = creatureID,
        petNumber = tonumber(info.petNumber),
        slotID = tonumber(info.slotID),
        name = info.name,
        level = tonumber(info.level),
        familyName = info.familyName,
        specialization = info.specialization,
        petType = info.type,
        icon = tonumber(info.icon),
        displayID = tonumber(info.displayID),
        isFavorite = info.isFavorite == true,
        isExotic = info.isExotic == true,
        specID = tonumber(info.specID),
        source = source,
    }
end

local function appendPets(target, list, source)
    if type(list) ~= "table" then return end
    for _, info in pairs(list) do
        local pet = normalizePetInfo(info, source)
        if pet then
            local key = tostring(pet.creatureID) .. ":" .. tostring(pet.petNumber or pet.slotID or #target + 1)
            target[key] = pet
        end
    end
end

local function captureHunterPets(character)
    if getClassID(character) ~= HUNTER_CLASS_ID then return nil end
    character.hunterPets = character.hunterPets or {}
    local capturedAt = Collector.Utils.Now()
    local pets = {}
    local supported = C_StableInfo ~= nil

    if C_StableInfo then
        if type(C_StableInfo.GetActivePetList) == "function" then
            appendPets(pets, safeCall(C_StableInfo.GetActivePetList), "active")
        end
        if type(C_StableInfo.GetStabledPetList) == "function" then
            appendPets(pets, safeCall(C_StableInfo.GetStabledPetList), "stable")
        end
        if next(pets) == nil and type(C_StableInfo.GetNumStablePets) == "function" and type(C_StableInfo.GetStablePetInfo) == "function" then
            local total = tonumber(safeCall(C_StableInfo.GetNumStablePets)) or 0
            for index = 1, total do
                local pet = normalizePetInfo(safeCall(C_StableInfo.GetStablePetInfo, index), "stable")
                if pet then
                    local key = tostring(pet.creatureID) .. ":" .. tostring(pet.petNumber or pet.slotID or index)
                    pets[key] = pet
                end
            end
        end
    end

    character.hunterPets.schemaVersion = 1
    character.hunterPets.supported = supported
    character.hunterPets.scannedAt = capturedAt
    character.hunterPets.pets = pets
    character.hunterPets.count = (function() local n=0 for _ in pairs(pets) do n=n+1 end return n end)()
    return character.hunterPets
end

function Module:Scan(_, done)
    local character = Collector:GetCurrentCharacter()
    if not character then
        done({ ok = false, error = "Personnage indisponible" })
        return
    end
    local result = captureHunterPets(character)
    done({
        ok = true,
        supported = result and result.supported == true or false,
        hunterPets = result and result.count or 0,
        scannedAt = result and result.scannedAt or Collector.Utils.Now(),
    })
end

function Module:OnEvent(event)
    if event == "PLAYER_ENTERING_WORLD" or event == "PET_STABLE_UPDATE" or event == "PET_STABLE_SHOW" then
        local character = Collector:GetCurrentCharacter()
        if character then captureHunterPets(character) end
    end
end

Collector:RegisterModule("HunterPets", Module)
