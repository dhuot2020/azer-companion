local addonName, Collector = ...
local Module = {}

local BATCH_SIZE = 120

local function achievementRecord(achievementID)
    local id, name, points, completed, month, day, year, description, flags, icon, rewardText, isGuild, wasEarnedByMe, earnedBy = GetAchievementInfo(achievementID)
    if not id or not name then
        return nil
    end

    return {
        id = id,
        name = name,
        description = description,
        points = points,
        completed = completed and true or false,
        completedAt = completed and Collector.Utils.DateToTimestamp(month, day, year) or nil,
        month = month,
        day = day,
        year = year,
        flags = flags,
        icon = icon,
        rewardText = rewardText,
        isGuild = isGuild and true or false,
        wasEarnedByMe = wasEarnedByMe and true or false,
        earnedBy = earnedBy,
        scannedAt = Collector.Utils.Now(),
    }
end

local function collectAchievementIDs()
    local ids = {}
    local seen = {}
    local categories = GetCategoryList and GetCategoryList() or {}

    for _, categoryID in ipairs(categories) do
        local achievementCount = 0
        if GetCategoryNumAchievements then
            achievementCount = GetCategoryNumAchievements(categoryID) or 0
        end

        for index = 1, achievementCount do
            local achievementID = GetAchievementInfo(categoryID, index)
            if achievementID and not seen[achievementID] then
                seen[achievementID] = true
                table.insert(ids, achievementID)
            end
        end
    end

    return ids
end

local function saveAchievement(record, character)
    AzerCompanionDB.account.achievements[record.id] = record

    if record.wasEarnedByMe and character then
        character.achievements[record.id] = record
    end
end

function Module:Scan(_, done)
    local character = Collector:GetCurrentCharacter()
    local ids = collectAchievementIDs()
    local index = 1
    local completedCount = 0
    local characterCount = 0

    local function processBatch()
        local lastIndex = math.min(#ids, index + BATCH_SIZE - 1)
        for position = index, lastIndex do
            local record = achievementRecord(ids[position])
            if record then
                saveAchievement(record, character)
                if record.completed then
                    completedCount = completedCount + 1
                end
                if record.wasEarnedByMe then
                    characterCount = characterCount + 1
                end
            end
        end

        index = lastIndex + 1
        if index <= #ids then
            C_Timer.After(0, processBatch)
            return
        end

        AzerCompanionDB.account.achievementSummary = {
            scanned = #ids,
            completed = completedCount,
            earnedByCurrentCharacter = characterCount,
            scannedAt = Collector.Utils.Now(),
        }

        done({
            ok = true,
            scanned = #ids,
            completed = completedCount,
            earnedByCurrentCharacter = characterCount,
        })
    end

    processBatch()
end

function Module:OnEvent(event, achievementID)
    if event ~= "ACHIEVEMENT_EARNED" or not achievementID then
        return
    end

    C_Timer.After(0.5, function()
        local character = Collector:GetCurrentCharacter()
        local record = achievementRecord(achievementID)
        if record then
            record.observedEarnedAt = Collector.Utils.Now()
            saveAchievement(record, character)
            AzerCompanionDB.account.lastEvent = "achievement_earned"
            AzerCompanionDB.account.lastEventAt = record.observedEarnedAt
        end
    end)
end

Collector:RegisterModule("Achievements", Module)
