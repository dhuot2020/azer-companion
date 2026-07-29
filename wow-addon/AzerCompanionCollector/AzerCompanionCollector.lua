local addonName = ...

local SCHEMA_VERSION = 1
local MAX_SESSION_HISTORY = 50
local LOCATION_REFRESH_SECONDS = 30

local eventFrame = CreateFrame("Frame")
local currentCharacter
local locationTicker

local function now()
	return time()
end

local function addonVersion()
	if C_AddOns and C_AddOns.GetAddOnMetadata then
		return C_AddOns.GetAddOnMetadata(addonName, "Version")
	end

	if GetAddOnMetadata then
		return GetAddOnMetadata(addonName, "Version")
	end

	return "unknown"
end

local function initializeDatabase()
	if type(AzerCompanionDB) ~= "table" then
		AzerCompanionDB = {}
	end

	AzerCompanionDB.schemaVersion = SCHEMA_VERSION
	AzerCompanionDB.addonVersion = addonVersion()
	AzerCompanionDB.characters = AzerCompanionDB.characters or {}
	AzerCompanionDB.account = AzerCompanionDB.account or {}
end

local function playerIdentity()
	local name, realm = UnitFullName("player")
	name = name or UnitName("player") or "Unknown"

	if not realm or realm == "" then
		realm = GetNormalizedRealmName and GetNormalizedRealmName() or GetRealmName()
	end

	local guid = UnitGUID("player")
	if not guid then
		return nil
	end

	return {
		guid = guid,
		name = name,
		realm = realm or "Unknown",
		key = name .. "-" .. (realm or "Unknown"),
	}
end

local function ensureCharacter()
	local identity = playerIdentity()
	if not identity then
		return nil
	end

	local character = AzerCompanionDB.characters[identity.guid]
	if type(character) ~= "table" then
		character = {
			guid = identity.guid,
			firstSeenAt = now(),
			sessions = {},
		}
		AzerCompanionDB.characters[identity.guid] = character
	end

	character.name = identity.name
	character.realm = identity.realm
	character.key = identity.key
	character.sessions = character.sessions or {}
	currentCharacter = character

	return character
end

local function captureProfile(character)
	if not character then
		return
	end

	local className, classFile, classID = UnitClass("player")
	local raceName, raceFile, raceID = UnitRace("player")
	local faction, localizedFaction = UnitFactionGroup("player")
	local specializationIndex = GetSpecialization and GetSpecialization()
	local specializationID
	local specializationName
	local specializationRole

	if specializationIndex and GetSpecializationInfo then
		specializationID, specializationName, _, _, specializationRole =
			GetSpecializationInfo(specializationIndex)
	end

	local averageItemLevel
	local equippedItemLevel
	local pvpItemLevel
	if GetAverageItemLevel then
		averageItemLevel, equippedItemLevel, pvpItemLevel = GetAverageItemLevel()
	end

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
		sex = UnitSex("player"),
		specializationID = specializationID,
		specializationName = specializationName,
		specializationRole = specializationRole,
		averageItemLevel = averageItemLevel,
		equippedItemLevel = equippedItemLevel,
		pvpItemLevel = pvpItemLevel,
		money = GetMoney and GetMoney() or nil,
		capturedAt = now(),
	}
end

local function professionData(professionIndex, category)
	if not professionIndex or not GetProfessionInfo then
		return nil
	end

	local name, icon, skillLevel, maxSkillLevel, _, _, skillLine, skillModifier =
		GetProfessionInfo(professionIndex)

	if not name then
		return nil
	end

	return {
		category = category,
		name = name,
		icon = icon,
		skillLevel = skillLevel,
		maxSkillLevel = maxSkillLevel,
		skillLine = skillLine,
		skillModifier = skillModifier,
	}
end

local function captureProfessions(character)
	if not character or not GetProfessions then
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
		local profession = professionData(candidate[1], candidate[2])
		if profession then
			table.insert(professions, profession)
		end
	end

	character.professions = professions
	character.professionsCapturedAt = now()
end

local function captureLocation(character)
	if not character then
		return
	end

	local previousLocation = character.location or {}
	local detectedMapID
	if C_Map and C_Map.GetBestMapForUnit then
		detectedMapID = C_Map.GetBestMapForUnit("player")
	end
	local mapID = detectedMapID or previousLocation.mapID

	local x
	local y
	if mapID and C_Map.GetPlayerMapPosition then
		local position = C_Map.GetPlayerMapPosition(mapID, "player")
		if position and position.GetXY then
			x, y = position:GetXY()
		end
	end
	if mapID == previousLocation.mapID then
		x = x or previousLocation.x
		y = y or previousLocation.y
	end

	local instanceName
	local instanceType
	local difficultyID
	local difficultyName
	local instanceID
	if GetInstanceInfo then
		instanceName, instanceType, difficultyID, difficultyName, _, _, _, instanceID =
			GetInstanceInfo()
	end

	character.location = {
		zone = GetZoneText and GetZoneText() or nil,
		realZone = GetRealZoneText and GetRealZoneText() or nil,
		subZone = GetSubZoneText and GetSubZoneText() or nil,
		mapID = mapID,
		x = x,
		y = y,
		instanceName = instanceName,
		instanceType = instanceType,
		difficultyID = difficultyID,
		difficultyName = difficultyName,
		instanceID = instanceID,
		capturedAt = now(),
	}
end

local function refreshCharacter()
	local character = ensureCharacter()
	if not character then
		return
	end

	captureProfile(character)
	captureProfessions(character)
	captureLocation(character)
	character.lastSeenAt = now()

	AzerCompanionDB.account.lastCharacterGuid = character.guid
	AzerCompanionDB.account.lastCharacterKey = character.key
	AzerCompanionDB.account.updatedAt = now()
end

local function archiveSession(character, session)
	if not character or not session then
		return
	end

	table.insert(character.sessions, session)
	while #character.sessions > MAX_SESSION_HISTORY do
		table.remove(character.sessions, 1)
	end
end

local function startSession()
	refreshCharacter()
	local character = currentCharacter
	if not character then
		return
	end

	local startedAt = now()

	if character.currentSession then
		local previousSession = character.currentSession
		previousSession.endedAt = previousSession.endedAt or startedAt
		previousSession.durationSeconds =
			math.max(0, previousSession.endedAt - (previousSession.startedAt or previousSession.endedAt))
		previousSession.endReason = previousSession.endReason or "interrupted"
		archiveSession(character, previousSession)
	end

	character.currentSession = {
		id = tostring(startedAt) .. ":" .. character.guid,
		startedAt = startedAt,
		startLocation = character.location,
	}
	character.lastLoginAt = startedAt
	character.online = true

	AzerCompanionDB.account.lastEvent = "login"
	AzerCompanionDB.account.lastEventAt = startedAt

	if C_Timer and C_Timer.NewTicker and not locationTicker then
		locationTicker = C_Timer.NewTicker(LOCATION_REFRESH_SECONDS, function()
			local activeCharacter = ensureCharacter()
			if activeCharacter then
				captureLocation(activeCharacter)
				activeCharacter.lastSeenAt = now()
			end
		end)
	end
end

local function finishSession()
	local character = currentCharacter or ensureCharacter()
	if not character then
		return
	end

	local endedAt = now()

	if locationTicker then
		locationTicker:Cancel()
		locationTicker = nil
	end

	local session = character.currentSession or {
		id = tostring(endedAt) .. ":" .. character.guid,
		startedAt = character.lastLoginAt or endedAt,
	}

	session.endedAt = endedAt
	session.durationSeconds = math.max(0, endedAt - (session.startedAt or endedAt))
	session.endReason = "logout_or_reload"
	session.endLocation = character.location
	archiveSession(character, session)

	character.currentSession = nil
	character.lastLogoutAt = endedAt
	character.lastSeenAt = endedAt
	character.online = false

	AzerCompanionDB.account.lastCharacterGuid = character.guid
	AzerCompanionDB.account.lastCharacterKey = character.key
	AzerCompanionDB.account.lastEvent = "logout_or_reload"
	AzerCompanionDB.account.lastEventAt = endedAt
	AzerCompanionDB.account.updatedAt = endedAt
end

local function delayedRefresh()
	refreshCharacter()
	if C_Timer and C_Timer.After then
		C_Timer.After(1, refreshCharacter)
	end
end

eventFrame:SetScript("OnEvent", function(_, event, ...)
	if event == "ADDON_LOADED" then
		local loadedAddonName = ...
		if loadedAddonName == addonName then
			initializeDatabase()
		end
		return
	end

	if event == "PLAYER_LOGIN" then
		startSession()
	elseif event == "PLAYER_LOGOUT" then
		finishSession()
	elseif event == "PLAYER_ENTERING_WORLD" then
		delayedRefresh()
	else
		refreshCharacter()
	end
end)

eventFrame:RegisterEvent("ADDON_LOADED")
eventFrame:RegisterEvent("PLAYER_LOGIN")
eventFrame:RegisterEvent("PLAYER_LOGOUT")
eventFrame:RegisterEvent("PLAYER_ENTERING_WORLD")
eventFrame:RegisterEvent("ZONE_CHANGED")
eventFrame:RegisterEvent("ZONE_CHANGED_INDOORS")
eventFrame:RegisterEvent("ZONE_CHANGED_NEW_AREA")
eventFrame:RegisterEvent("PLAYER_LEVEL_UP")
eventFrame:RegisterEvent("PLAYER_SPECIALIZATION_CHANGED")
eventFrame:RegisterEvent("PLAYER_EQUIPMENT_CHANGED")
eventFrame:RegisterEvent("SKILL_LINES_CHANGED")
eventFrame:RegisterEvent("PLAYER_MONEY")
