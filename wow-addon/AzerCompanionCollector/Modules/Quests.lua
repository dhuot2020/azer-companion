local addonName, Collector = ...
local Module = {}

local pendingQuestOwners = {}
local HISTORY_TITLE_REQUEST_LIMIT = 300

local function countTable(values)
    local count = 0
    for _ in pairs(values or {}) do
        count = count + 1
    end
    return count
end

local function getQuestMapInfo(questID)
    local mapID
    local mapName

    if C_QuestLog and C_QuestLog.GetQuestZoneID then
        mapID = C_QuestLog.GetQuestZoneID(questID)
    end

    if mapID and C_Map and C_Map.GetMapInfo then
        local mapInfo = C_Map.GetMapInfo(mapID)
        mapName = mapInfo and mapInfo.name or nil
    end

    return mapID, mapName
end

local function getQuestTitle(questID)
    if C_QuestLog and C_QuestLog.GetTitleForQuestID then
        local title = C_QuestLog.GetTitleForQuestID(questID)
        if title and title ~= "" then
            return title
        end
    end
    return nil
end

local function getQuestObjectives(questID, logIndex)
    local objectives = {}

    if C_QuestLog and C_QuestLog.GetQuestObjectives then
        local apiObjectives = C_QuestLog.GetQuestObjectives(questID)
        if type(apiObjectives) == "table" then
            for objectiveIndex, objective in ipairs(apiObjectives) do
                table.insert(objectives, {
                    index = objectiveIndex,
                    text = objective.text,
                    type = objective.type,
                    finished = objective.finished and true or false,
                    numFulfilled = objective.numFulfilled,
                    numRequired = objective.numRequired,
                })
            end
            return objectives
        end
    end

    local objectiveCount = GetNumQuestLeaderBoards and GetNumQuestLeaderBoards(logIndex) or 0
    for objectiveIndex = 1, objectiveCount do
        local text, objectiveType, finished = GetQuestLogLeaderBoard(objectiveIndex, logIndex)
        table.insert(objectives, {
            index = objectiveIndex,
            text = text,
            type = objectiveType,
            finished = finished and true or false,
        })
    end

    return objectives
end

local function ensureQuestTables(character)
    character.quests = character.quests or {}
    character.quests.active = character.quests.active or {}
    character.quests.completedObserved = character.quests.completedObserved or {}
    character.quests.completedHistory = character.quests.completedHistory or {}
    character.quests.completedAccountShared = character.quests.completedAccountShared or {}
end

local function getQuestTagID(questID)
    if not C_QuestLog or not C_QuestLog.GetQuestTagInfo then
        return nil
    end

    local tagInfo = C_QuestLog.GetQuestTagInfo(questID)
    if type(tagInfo) == "table" then
        return tagInfo.tagID or tagInfo.tagId
    end

    return tagInfo
end

local function isAccountSharedQuest(questID)
    local isAccountQuest = false
    if C_QuestLog and C_QuestLog.IsAccountQuest then
        local ok, result = pcall(C_QuestLog.IsAccountQuest, questID)
        isAccountQuest = ok and result and true or false
    end

    -- Les quêtes de combats de mascottes sont connues pour être partagées
    -- au niveau du compte et apparaissent dans GetAllCompletedQuestIDs pour
    -- tous les personnages.
    local tagID = getQuestTagID(questID)
    local isPetBattleQuest = tonumber(tagID) == 102

    return isAccountQuest or isPetBattleQuest, isAccountQuest, isPetBattleQuest, tagID
end

local function captureActiveQuests(character)
    ensureQuestTables(character)

    local active = {}
    local entries = C_QuestLog and C_QuestLog.GetNumQuestLogEntries and C_QuestLog.GetNumQuestLogEntries() or 0

    for index = 1, entries do
        local info = C_QuestLog.GetInfo(index)
        if info and not info.isHeader and info.questID then
            local questID = info.questID
            local mapID, mapName = getQuestMapInfo(questID)
            local campaignID

            if C_CampaignInfo and C_CampaignInfo.GetCampaignID then
                campaignID = C_CampaignInfo.GetCampaignID(questID)
            end

            active[questID] = {
                id = questID,
                title = info.title or getQuestTitle(questID),
                level = info.level,
                suggestedGroup = info.suggestedGroup,
                frequency = info.frequency,
                isOnMap = info.isOnMap and true or false,
                hasLocalPOI = info.hasLocalPOI and true or false,
                isTask = info.isTask and true or false,
                isBounty = info.isBounty and true or false,
                isHidden = info.isHidden and true or false,
                isComplete = C_QuestLog.IsComplete and C_QuestLog.IsComplete(questID) or false,
                isWorldQuest = C_QuestLog.IsWorldQuest and C_QuestLog.IsWorldQuest(questID) or false,
                isCalling = C_QuestLog.IsQuestCalling and C_QuestLog.IsQuestCalling(questID) or false,
                campaignID = campaignID,
                mapID = mapID,
                mapName = mapName,
                objectives = getQuestObjectives(questID, index),
                scannedAt = Collector.Utils.Now(),
            }
        end
    end

    character.quests.active = active
    character.quests.activeScannedAt = Collector.Utils.Now()
    character.quests.activeCount = countTable(active)
    return active
end

local function updateHistoricalQuestMetadata(character, questID)
    ensureQuestTables(character)
    local record = character.quests.completedHistory[questID]
        or character.quests.completedAccountShared[questID]
    if type(record) ~= "table" then
        return false
    end

    local title = getQuestTitle(questID)
    local mapID, mapName = getQuestMapInfo(questID)
    if title then record.title = title end
    if mapID then record.mapID = mapID end
    if mapName then record.mapName = mapName end
    record.metadataUpdatedAt = Collector.Utils.Now()
    return title ~= nil
end

local function captureCompletedHistory(character)
    ensureQuestTables(character)

    local completedIDs = {}
    if C_QuestLog and C_QuestLog.GetAllCompletedQuestIDs then
        completedIDs = C_QuestLog.GetAllCompletedQuestIDs() or {}
    end

    local history = {}
    local accountShared = {}
    local requestedTitles = 0
    local importedAt = Collector.Utils.Now()

    for _, questID in ipairs(completedIDs) do
        local isShared, isAccountQuest, isPetBattleQuest, tagID = isAccountSharedQuest(questID)
        local previousCharacter = character.quests.completedHistory[questID]
        local previousAccount = character.quests.completedAccountShared[questID]
        local previous = previousCharacter or previousAccount
        local mapID, mapName = getQuestMapInfo(questID)
        local title = getQuestTitle(questID)

        local record = {
            id = questID,
            title = title or (previous and previous.title) or nil,
            mapID = mapID or (previous and previous.mapID) or nil,
            mapName = mapName or (previous and previous.mapName) or nil,
            importedAt = previous and previous.importedAt or importedAt,
            lastConfirmedAt = importedAt,
            source = isShared and "account_shared_scan" or "character_historical_scan",
            scope = isShared and "account" or "character",
            isAccountQuest = isAccountQuest,
            isPetBattleQuest = isPetBattleQuest,
            questTagID = tagID,
            characterGuid = character.guid,
            characterName = character.name,
            characterRealm = character.realm,
        }

        if isShared then
            accountShared[questID] = record
        else
            history[questID] = record
        end

        if not title and C_QuestLog and C_QuestLog.RequestLoadQuestByID and requestedTitles < HISTORY_TITLE_REQUEST_LIMIT then
            pendingQuestOwners[questID] = character.storageKey or character.guid
            C_QuestLog.RequestLoadQuestByID(questID)
            requestedTitles = requestedTitles + 1
        end
    end

    -- Remplace les anciennes listes afin de retirer automatiquement les
    -- quêtes de compte qui avaient été classées à tort comme personnelles.
    character.quests.completedHistory = history
    character.quests.completedAccountShared = accountShared
    character.quests.completedHistoryCount = countTable(history)
    character.quests.completedAccountSharedCount = countTable(accountShared)
    character.quests.completedHistoryScannedAt = importedAt
    character.quests.completedHistoryTitleRequests = requestedTitles
    return history, accountShared, requestedTitles
end

local function recordCompletedQuest(character, questID, experienceReward, moneyReward)
    ensureQuestTables(character)
    AzerCompanionDB.account.quests = AzerCompanionDB.account.quests or {}
    AzerCompanionDB.account.quests.completedObserved = AzerCompanionDB.account.quests.completedObserved or {}

    local mapID, mapName = getQuestMapInfo(questID)
    local now = Collector.Utils.Now()
    local record = {
        id = questID,
        title = getQuestTitle(questID),
        completedAt = now,
        experienceReward = experienceReward,
        moneyReward = moneyReward,
        mapID = mapID,
        mapName = mapName,
        characterGuid = character.guid,
        characterName = character.name,
        characterRealm = character.realm,
        source = "observed_turn_in",
    }

    table.insert(character.quests.completedObserved, record)
    Collector.Utils.TrimArray(character.quests.completedObserved, 5000)
    local isShared, isAccountQuest, isPetBattleQuest, tagID = isAccountSharedQuest(questID)
    local target = isShared and character.quests.completedAccountShared or character.quests.completedHistory
    target[questID] = target[questID] or {
        id = questID,
        title = record.title,
        mapID = mapID,
        mapName = mapName,
        importedAt = now,
        lastConfirmedAt = now,
        source = isShared and "observed_account_turn_in" or "observed_turn_in",
        scope = isShared and "account" or "character",
        isAccountQuest = isAccountQuest,
        isPetBattleQuest = isPetBattleQuest,
        questTagID = tagID,
        characterGuid = character.guid,
        characterName = character.name,
        characterRealm = character.realm,
    }
    character.quests.completedHistoryCount = countTable(character.quests.completedHistory)
    character.quests.completedAccountSharedCount = countTable(character.quests.completedAccountShared)

    AzerCompanionDB.account.quests.completedObserved[questID] = record
    AzerCompanionDB.account.quests.lastCompletedAt = record.completedAt
    AzerCompanionDB.account.lastEvent = "quest_completed"
    AzerCompanionDB.account.lastEventAt = record.completedAt
end

function Module:Scan(_, done)
    local character = Collector:GetCurrentCharacter()
    if not character then
        done({ ok = false, error = "Personnage indisponible" })
        return
    end

    local active = captureActiveQuests(character)
    local history, accountShared, requestedTitles = captureCompletedHistory(character)
    done({
        ok = true,
        active = countTable(active),
        completedHistory = countTable(history),
        completedAccountShared = countTable(accountShared),
        completedObserved = #(character.quests.completedObserved or {}),
        requestedTitles = requestedTitles,
        historyMode = "full_completed_ids",
        scannedAt = character.quests.activeScannedAt,
    })
end

function Module:OnEvent(event, ...)
    local character = Collector:GetCurrentCharacter()
    if not character then
        return
    end

    if event == "QUEST_LOG_UPDATE" or event == "PLAYER_ENTERING_WORLD" then
        captureActiveQuests(character)
    elseif event == "QUEST_TURNED_IN" then
        local questID, experienceReward, moneyReward = ...
        if questID then
            recordCompletedQuest(character, questID, experienceReward, moneyReward)
            captureActiveQuests(character)
        end
    elseif event == "QUEST_DATA_LOAD_RESULT" then
        local questID, success = ...
        if success and questID then
            local ownerKey = pendingQuestOwners[questID]
            local owner = ownerKey and AzerCompanionDB.characters and AzerCompanionDB.characters[ownerKey]
            if owner then
                updateHistoricalQuestMetadata(owner, questID)
            else
                updateHistoricalQuestMetadata(character, questID)
            end
            pendingQuestOwners[questID] = nil
        end
    end
end

Collector:RegisterModule("Quests", Module)
