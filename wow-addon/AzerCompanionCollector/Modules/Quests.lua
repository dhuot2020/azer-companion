local addonName, Collector = ...
local Module = {}

local pendingQuestOwners = {}
local HISTORY_TITLE_REQUEST_LIMIT = 300

local function safeCall(fn, ...)
    if type(fn) ~= "function" then return nil end
    local ok, a, b, c, d, e, f, g, h, i, j = pcall(fn, ...)
    if not ok then return nil end
    return a, b, c, d, e, f, g, h, i, j
end

local HUNTER_CLASS_ID = 3
local HUNTER_TAMING_UNLOCKS = {
    dragonkin = { questFlagID = 72094 },
    ottuk = { questFlagID = 66444 },
    ["cloud-serpent"] = { questFlagID = 62254 },
    undead = { questFlagID = 62255 },
    gargon = { questFlagID = 61160 },
    ["blood-beast"] = { questFlagID = 54753 },
    direhorn = { spellID = 138430 },
    mechanical = { spellID = 205154 },
    feathermane = { spellID = 242155 },
}

local function getCharacterClassID(character)
    local classID = tonumber(character and character.profile and character.profile.classID)
    if classID then return classID end
    local _, _, unitClassID = safeCall(UnitClass, "player")
    return tonumber(unitClassID)
end

local function isQuestFlagCompleted(questID)
    if not questID or not C_QuestLog or type(C_QuestLog.IsQuestFlaggedCompleted) ~= "function" then
        return nil, false
    end
    local ok, result = pcall(C_QuestLog.IsQuestFlaggedCompleted, questID)
    if not ok then return nil, false end
    return result and true or false, true
end

local function isSpellKnownForPlayer(spellID)
    if not spellID then return nil, false end

    if type(IsSpellKnown) == "function" then
        local ok, result = pcall(IsSpellKnown, spellID)
        if ok then return result and true or false, true end
    end

    if C_SpellBook and type(C_SpellBook.IsSpellKnown) == "function" then
        local ok, result = pcall(C_SpellBook.IsSpellKnown, spellID)
        if ok then return result and true or false, true end
    end

    return nil, false
end

local function captureClassUnlocks(character)
    character.classProgress = character.classProgress or {}
    character.classProgress.scannedAt = Collector.Utils.Now()

    if getCharacterClassID(character) ~= HUNTER_CLASS_ID then
        return character.classProgress
    end

    local hunter = character.classProgress.hunter or {}
    local taming = {}

    for unlockID, definition in pairs(HUNTER_TAMING_UNLOCKS) do
        local completed
        local supported = false
        local source
        local sourceID

        if definition.questFlagID then
            completed, supported = isQuestFlagCompleted(definition.questFlagID)
            source = "quest_flag"
            sourceID = definition.questFlagID
        elseif definition.spellID then
            completed, supported = isSpellKnownForPlayer(definition.spellID)
            source = "spell_known"
            sourceID = definition.spellID
        end

        taming[unlockID] = {
            id = unlockID,
            completed = completed == true,
            supported = supported == true,
            source = source,
            sourceID = sourceID,
            scannedAt = character.classProgress.scannedAt,
        }
    end

    hunter.taming = taming
    hunter.scannedAt = character.classProgress.scannedAt
    character.classProgress.hunter = hunter
    return character.classProgress
end

local function safeNumber(fn, ...)
    local value = safeCall(fn, ...)
    if type(value) == "number" then return value end
    if type(value) == "string" then return tonumber(value) end
    return nil
end

local function getSelectedQuestID()
    if C_QuestLog and C_QuestLog.GetSelectedQuest then
        return safeNumber(C_QuestLog.GetSelectedQuest)
    end
    return nil
end

local function selectQuest(questID, logIndex)
    if C_QuestLog and C_QuestLog.SetSelectedQuest and questID then
        safeCall(C_QuestLog.SetSelectedQuest, questID)
        return
    end
    if SelectQuestLogEntry and logIndex then
        safeCall(SelectQuestLogEntry, logIndex)
    end
end

local function restoreSelectedQuest(previousQuestID, previousLogIndex)
    if C_QuestLog and C_QuestLog.SetSelectedQuest and previousQuestID and previousQuestID > 0 then
        safeCall(C_QuestLog.SetSelectedQuest, previousQuestID)
        return
    end
    if SelectQuestLogEntry and previousLogIndex and previousLogIndex > 0 then
        safeCall(SelectQuestLogEntry, previousLogIndex)
    end
end

local function withSelectedQuest(questID, logIndex, callback)
    local previousQuestID = getSelectedQuestID()
    local previousLogIndex = GetQuestLogSelection and safeNumber(GetQuestLogSelection) or nil
    selectQuest(questID, logIndex)
    local results = { callback() }
    restoreSelectedQuest(previousQuestID, previousLogIndex)
    return unpack(results)
end

local function normalizeQuestText(value)
    if type(value) ~= "string" then return nil end
    value = value:gsub("^%s+", ""):gsub("%s+$", "")
    if value == "" then return nil end
    return value
end

local function getQuestTextDetails(questID, logIndex)
    return withSelectedQuest(questID, logIndex, function()
        local description, objectiveText = safeCall(GetQuestLogQuestText)
        local completionText = safeCall(GetQuestLogCompletionText)
        return normalizeQuestText(description), normalizeQuestText(objectiveText), normalizeQuestText(completionText)
    end)
end

local function callRewardCount(fn, questID)
    local count = safeNumber(fn)
    if count == nil and questID then count = safeNumber(fn, questID) end
    return count or 0
end

local function callRewardInfo(fn, index, questID)
    local values = { safeCall(fn, index) }
    if values[1] == nil and questID then values = { safeCall(fn, index, questID) } end
    return unpack(values)
end

local function getQuestRewardItems(questID, choice)
    local items = {}
    local countFn = choice and GetNumQuestLogChoices or GetNumQuestLogRewards
    local infoFn = choice and GetQuestLogChoiceInfo or GetQuestLogRewardInfo
    local count = callRewardCount(countFn, questID)
    for index = 1, count do
        local name, texture, quantity, quality, isUsable, itemID, itemLevel = callRewardInfo(infoFn, index, questID)
        table.insert(items, {
            index = index,
            name = name,
            texture = texture,
            iconFileID = type(texture) == "number" and texture or nil,
            quantity = quantity or 1,
            quality = quality,
            isUsable = isUsable and true or false,
            itemID = itemID,
            itemLevel = itemLevel,
            isChoice = choice and true or false,
        })
    end
    return items
end

local function getQuestRewardCurrencies(questID)
    local currencies = {}
    local count = callRewardCount(GetNumQuestLogRewardCurrencies, questID)
    for index = 1, count do
        local name, texture, quantity, currencyID, quality = callRewardInfo(GetQuestLogRewardCurrencyInfo, index, questID)
        table.insert(currencies, {
            index = index,
            name = name,
            texture = texture,
            iconFileID = type(texture) == "number" and texture or nil,
            quantity = quantity or 0,
            currencyID = currencyID,
            quality = quality,
        })
    end
    return currencies
end

local function getQuestRewardSpell(questID)
    local texture, name, isTradeskillSpell, isSpellLearned, hideSpellLearnText, isBoostSpell = safeCall(GetQuestLogRewardSpell)
    if texture == nil and questID then
        texture, name, isTradeskillSpell, isSpellLearned, hideSpellLearnText, isBoostSpell = safeCall(GetQuestLogRewardSpell, questID)
    end
    if not texture and not name then return nil end
    return {
        texture = texture,
        iconFileID = type(texture) == "number" and texture or nil,
        name = name,
        isTradeskillSpell = isTradeskillSpell and true or false,
        isSpellLearned = isSpellLearned and true or false,
        hideSpellLearnText = hideSpellLearnText and true or false,
        isBoostSpell = isBoostSpell and true or false,
    }
end

local function getQuestRewards(questID, logIndex)
    return withSelectedQuest(questID, logIndex, function()
        local experience = safeNumber(GetQuestLogRewardXP)
        if experience == nil then experience = safeNumber(GetQuestLogRewardXP, questID) end
        local money = safeNumber(GetQuestLogRewardMoney)
        if money == nil then money = safeNumber(GetQuestLogRewardMoney, questID) end
        local artifactXP = safeNumber(GetQuestLogRewardArtifactXP) or 0
        return {
            experience = experience or 0,
            money = money or 0,
            artifactXP = artifactXP,
            items = getQuestRewardItems(questID, false),
            choices = getQuestRewardItems(questID, true),
            currencies = getQuestRewardCurrencies(questID),
            spell = getQuestRewardSpell(questID),
        }
    end)
end

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
    character.quests.activeRaw = character.quests.activeRaw or {}
    character.quests.activeAccountShared = character.quests.activeAccountShared or {}
    character.quests.completedObserved = character.quests.completedObserved or {}
    character.quests.completedHistory = character.quests.completedHistory or {}
    character.quests.completedAccountShared = character.quests.completedAccountShared or {}

    AzerCompanionDB.account = AzerCompanionDB.account or {}
    AzerCompanionDB.account.quests = AzerCompanionDB.account.quests or {}
    AzerCompanionDB.account.quests.completedShared = AzerCompanionDB.account.quests.completedShared or {}
    AzerCompanionDB.account.quests.completedObserved = AzerCompanionDB.account.quests.completedObserved or {}
    AzerCompanionDB.account.quests.activeShared = AzerCompanionDB.account.quests.activeShared or {}
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

local function getCharacterQuestRawActive(character)
    ensureQuestTables(character)
    if next(character.quests.activeRaw or {}) then
        return character.quests.activeRaw
    end

    -- Migration Alpha 13.5: avant la séparation Compte/Personnage,
    -- la table active contenait les deux portées.
    return character.quests.active or {}
end

local function rebuildActiveQuestScopes()
    AzerCompanionDB.account = AzerCompanionDB.account or {}
    AzerCompanionDB.account.quests = AzerCompanionDB.account.quests or {}

    local occurrences = {}
    local recordsByQuestID = {}

    for _, storedCharacter in pairs(AzerCompanionDB.characters or {}) do
        if type(storedCharacter) == "table" then
            ensureQuestTables(storedCharacter)
            local rawActive = getCharacterQuestRawActive(storedCharacter)
            for questID, record in pairs(rawActive) do
                local numericQuestID = tonumber(questID) or tonumber(record and record.id)
                if numericQuestID then
                    occurrences[numericQuestID] = (occurrences[numericQuestID] or 0) + 1
                    recordsByQuestID[numericQuestID] = recordsByQuestID[numericQuestID] or record
                end
            end
        end
    end

    local accountActive = {}
    for questID, record in pairs(recordsByQuestID) do
        local explicitShared = record and (record.isAccountQuest or record.isPetBattleQuest)
        if explicitShared or (occurrences[questID] or 0) >= 2 then
            local sharedRecord = {}
            for key, value in pairs(record or {}) do sharedRecord[key] = value end
            sharedRecord.scope = "account"
            sharedRecord.scopeReason = explicitShared and "blizzard_account" or "active_on_multiple_characters"
            sharedRecord.sharedCharacterCount = occurrences[questID] or 1
            accountActive[questID] = sharedRecord
        end
    end

    for _, storedCharacter in pairs(AzerCompanionDB.characters or {}) do
        if type(storedCharacter) == "table" then
            ensureQuestTables(storedCharacter)
            local personal = {}
            local shared = {}
            for questID, record in pairs(getCharacterQuestRawActive(storedCharacter)) do
                local numericQuestID = tonumber(questID) or tonumber(record and record.id)
                if numericQuestID and accountActive[numericQuestID] then
                    shared[numericQuestID] = accountActive[numericQuestID]
                elseif numericQuestID then
                    personal[numericQuestID] = record
                end
            end
            storedCharacter.quests.active = personal
            storedCharacter.quests.activeAccountShared = shared
            storedCharacter.quests.activeCount = countTable(personal)
            storedCharacter.quests.activeAccountSharedCount = countTable(shared)
        end
    end

    AzerCompanionDB.account.quests.activeShared = accountActive
    AzerCompanionDB.account.quests.activeSharedCount = countTable(accountActive)
    AzerCompanionDB.account.quests.activeSharedScannedAt = Collector.Utils.Now()
    return accountActive
end

local function captureActiveQuests(character)
    ensureQuestTables(character)

    -- Toujours reconstruire le journal actif depuis zéro afin d'éliminer
    -- les quêtes remises depuis le dernier scan.
    character.quests.activeRaw = {}
    character.quests.active = {}
    character.quests.activeAccountShared = {}
    character.quests.activeCount = 0
    character.quests.activeAccountSharedCount = 0

    local active = {}
    local snapshot = {}
    local entries = 0
    local currentHeaderName = nil

    if C_QuestLog and C_QuestLog.GetNumQuestLogEntries then
        entries = safeNumber(C_QuestLog.GetNumQuestLogEntries) or 0
    elseif GetNumQuestLogEntries then
        entries = safeNumber(GetNumQuestLogEntries) or 0
    end

    -- Première passe : prendre un instantané du journal SANS sélectionner de quête.
    -- La sélection d'une quête pendant la boucle peut rafraîchir le journal et rendre
    -- les index suivants invalides, ce qui expliquait le résultat à zéro.
    for index = 1, entries do
        local info = C_QuestLog and C_QuestLog.GetInfo and C_QuestLog.GetInfo(index) or nil
        local questID
        local isHeader = info and info.isHeader

        if info and isHeader then
            currentHeaderName = normalizeQuestText(info.title or info.name) or currentHeaderName
        end

        if info and not isHeader then
            questID = tonumber(info.questID)
        end

        if (not questID or questID <= 0) and C_QuestLog and C_QuestLog.GetQuestIDForLogIndex then
            questID = safeNumber(C_QuestLog.GetQuestIDForLogIndex, index)
        end

        -- Secours pour les clients/API où GetInfo ne retourne pas l'entrée complète.
        if (not info or not questID or questID <= 0) and GetQuestLogTitle then
            local title, level, suggestedGroup, legacyIsHeader, isCollapsed, isComplete, frequency, questLegacyID = safeCall(GetQuestLogTitle, index)
            if legacyIsHeader then
                currentHeaderName = normalizeQuestText(title) or currentHeaderName
            else
                questID = tonumber(questLegacyID) or questID
                if questID and questID > 0 then
                    info = info or {}
                    info.title = info.title or title
                    info.level = info.level or level
                    info.suggestedGroup = info.suggestedGroup or suggestedGroup
                    info.frequency = info.frequency or frequency
                    info.isComplete = info.isComplete or isComplete
                end
            end
        end

        if info and not isHeader and questID and questID > 0 then
            table.insert(snapshot, {
                index = index,
                questID = questID,
                info = info,
                journalHeader = currentHeaderName,
            })
        end
    end

    -- Deuxième passe : enrichir les quêtes après que tous les index ont été capturés.
    for _, entry in ipairs(snapshot) do
        local index = entry.index
        local questID = entry.questID
        local info = entry.info or {}
        local mapID, mapName = getQuestMapInfo(questID)
        local journalHeader = normalizeQuestText(entry.journalHeader)
        if not mapName and journalHeader then mapName = journalHeader end
        local campaignID

        if C_CampaignInfo and C_CampaignInfo.GetCampaignID then
            campaignID = safeCall(C_CampaignInfo.GetCampaignID, questID)
        end

        local isShared, isAccountQuest, isPetBattleQuest, tagID = isAccountSharedQuest(questID)
        local description, objectiveText, completionText = getQuestTextDetails(questID, index)
        local rewards = getQuestRewards(questID, index)

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
            isComplete = (C_QuestLog and C_QuestLog.IsComplete and C_QuestLog.IsComplete(questID)) or info.isComplete or false,
            isWorldQuest = C_QuestLog and C_QuestLog.IsWorldQuest and C_QuestLog.IsWorldQuest(questID) or false,
            isCalling = C_QuestLog and C_QuestLog.IsQuestCalling and C_QuestLog.IsQuestCalling(questID) or false,
            campaignID = campaignID,
            isAccountQuest = isAccountQuest,
            isPetBattleQuest = isPetBattleQuest,
            questTagID = tagID,
            scope = isShared and "account" or "character",
            mapID = mapID,
            mapName = mapName,
            journalHeader = journalHeader,
            description = description,
            objectiveText = objectiveText,
            completionText = completionText,
            objectives = getQuestObjectives(questID, index),
            rewards = rewards,
            scannedAt = Collector.Utils.Now(),
        }
    end

    character.quests.activeRaw = active
    character.quests.activeScannedAt = Collector.Utils.Now()
    character.quests.activeJournalEntries = entries
    character.quests.activeSnapshotCount = #snapshot
    rebuildActiveQuestScopes()
    return character.quests.active or {}
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

    for questID, record in pairs(accountShared) do
        AzerCompanionDB.account.quests.completedShared[questID] = record
    end

    character.quests.completedHistoryCount = countTable(history)
    character.quests.completedAccountSharedCount = countTable(accountShared)
    AzerCompanionDB.account.quests.completedSharedCount = countTable(AzerCompanionDB.account.quests.completedShared)
    AzerCompanionDB.account.quests.lastSharedScanAt = importedAt
    character.quests.completedHistoryScannedAt = importedAt
    character.quests.completedHistoryTitleRequests = requestedTitles
    return history, accountShared, requestedTitles
end

local function recordCompletedQuest(character, questID, experienceReward, moneyReward)
    ensureQuestTables(character)
    AzerCompanionDB.account.quests = AzerCompanionDB.account.quests or {}
    AzerCompanionDB.account.quests.completedObserved = AzerCompanionDB.account.quests.completedObserved or {}

    local previousActive = getCharacterQuestRawActive(character)[questID]
    local mapID, mapName = getQuestMapInfo(questID)
    if not mapID and previousActive then mapID = previousActive.mapID end
    if not mapName and previousActive then mapName = previousActive.mapName or previousActive.journalHeader end
    local now = Collector.Utils.Now()
    local record = {
        id = questID,
        title = getQuestTitle(questID) or (previousActive and previousActive.title),
        completedAt = now,
        experienceReward = experienceReward,
        moneyReward = moneyReward,
        mapID = mapID,
        mapName = mapName,
        journalHeader = previousActive and previousActive.journalHeader or nil,
        description = previousActive and previousActive.description or nil,
        objectiveText = previousActive and previousActive.objectiveText or nil,
        completionText = previousActive and previousActive.completionText or nil,
        objectives = previousActive and previousActive.objectives or nil,
        rewards = previousActive and previousActive.rewards or nil,
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

    if isShared then
        AzerCompanionDB.account.quests.completedShared[questID] = target[questID]
        AzerCompanionDB.account.quests.completedSharedCount = countTable(AzerCompanionDB.account.quests.completedShared)
    end

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
    local accountActive = AzerCompanionDB.account.quests.activeShared or {}
    local history, accountShared, requestedTitles = captureCompletedHistory(character)
    local classProgress = captureClassUnlocks(character)
    done({
        ok = true,
        active = countTable(active),
        activeAccountShared = countTable(character.quests.activeAccountShared),
        accountActive = countTable(accountActive),
        completedHistory = countTable(history),
        completedAccountShared = countTable(accountShared),
        completedObserved = #(character.quests.completedObserved or {}),
        requestedTitles = requestedTitles,
        historyMode = "full_completed_ids",
        classUnlocks = classProgress and classProgress.hunter and countTable(classProgress.hunter.taming) or 0,
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
        captureClassUnlocks(character)
    elseif event == "QUEST_TURNED_IN" then
        local questID, experienceReward, moneyReward = ...
        if questID then
            recordCompletedQuest(character, questID, experienceReward, moneyReward)
            captureActiveQuests(character)
            captureClassUnlocks(character)
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
