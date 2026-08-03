local addonName, Collector = ...

Collector.Utils = Collector.Utils or {}
local Utils = Collector.Utils

function Utils.Now()
    return time()
end

function Utils.SafeCall(callback, ...)
    if type(callback) ~= "function" then
        return nil
    end

    local ok, result1, result2, result3, result4, result5 = pcall(callback, ...)
    if not ok then
        Collector:Log("Erreur API: " .. tostring(result1))
        return nil
    end

    return result1, result2, result3, result4, result5
end

function Utils.TrimArray(values, maximum)
    if type(values) ~= "table" or not maximum then
        return
    end

    while #values > maximum do
        table.remove(values, 1)
    end
end

function Utils.PlayerIdentity()
    local name, realm = UnitFullName("player")
    name = name or UnitName("player") or "Unknown"

    if not realm or realm == "" then
        realm = GetNormalizedRealmName and GetNormalizedRealmName() or GetRealmName()
    end

    local normalizedRealm = tostring(realm or "Unknown")
    local normalizedName = tostring(name or "Unknown")
    local characterKey = string.lower(normalizedName .. "-" .. normalizedRealm)
    local guid = UnitGUID("player")

    return {
        guid = guid,
        name = normalizedName,
        realm = normalizedRealm,
        key = characterKey,
        storageKey = guid or ("character:" .. characterKey),
    }
end

function Utils.DateToTimestamp(month, day, year)
    if not month or not day or not year or year == 0 then
        return nil
    end

    local fullYear = year
    if fullYear < 100 then
        fullYear = 2000 + fullYear
    end

    return time({
        year = fullYear,
        month = month,
        day = day,
        hour = 12,
        min = 0,
        sec = 0,
    })
end
