local addonName, Collector = ...
Collector = Collector or {}
_G.AzerCompanionCollector = Collector

Collector.addonName = addonName
Collector.schemaVersion = 7
Collector.modules = Collector.modules or {}
Collector.moduleOrder = Collector.moduleOrder or {}
Collector.scanState = Collector.scanState or {
    running = false,
    startedAt = nil,
    finishedAt = nil,
    currentModule = nil,
    results = {},
}

local eventFrame = CreateFrame("Frame")
Collector.eventFrame = eventFrame

function Collector:Log(message)
    DEFAULT_CHAT_FRAME:AddMessage("|cff53b7ffAzer Companion|r - " .. tostring(message))
end

function Collector:GetAddonVersion()
    if C_AddOns and C_AddOns.GetAddOnMetadata then
        return C_AddOns.GetAddOnMetadata(addonName, "Version") or "unknown"
    end
    if GetAddOnMetadata then
        return GetAddOnMetadata(addonName, "Version") or "unknown"
    end
    return "unknown"
end

local function normalizeIdentityKey(name, realm)
    return string.lower(tostring(name or "unknown") .. "-" .. tostring(realm or "unknown"))
end

function Collector:InitializeDatabase()
    if type(AzerCompanionDB) ~= "table" then
        AzerCompanionDB = {}
    end

    AzerCompanionDB.schemaVersion = self.schemaVersion
    AzerCompanionDB.addonVersion = self:GetAddonVersion()
    AzerCompanionDB.account = AzerCompanionDB.account or {}
    AzerCompanionDB.account.achievements = AzerCompanionDB.account.achievements or {}
    AzerCompanionDB.account.quests = AzerCompanionDB.account.quests or { completedObserved = {} }
    AzerCompanionDB.characters = AzerCompanionDB.characters or {}
    AzerCompanionDB.characterAliases = AzerCompanionDB.characterAliases or {}
    AzerCompanionDB.sync = AzerCompanionDB.sync or {}
    AzerCompanionDB.sync.history = AzerCompanionDB.sync.history or {}
    AzerCompanionDB.modules = AzerCompanionDB.modules or {}
    AzerCompanionDB.diagnostics = AzerCompanionDB.diagnostics or {}
    AzerCompanionDB.diagnostics.characterWrites = AzerCompanionDB.diagnostics.characterWrites or {}

    -- Migration sans perte : toute entrée possédant un GUID devient canonique.
    -- Les anciennes clés nom-royaume sont conservées dans characterAliases.
    local migrations = {}
    for existingKey, existingCharacter in pairs(AzerCompanionDB.characters) do
        if type(existingCharacter) == "table" then
            local guid = tostring(existingCharacter.guid or "")
            local identityKey = normalizeIdentityKey(existingCharacter.name, existingCharacter.realm)
            existingCharacter.key = existingCharacter.key or identityKey

            if guid ~= "" and existingKey ~= guid then
                table.insert(migrations, {
                    oldKey = existingKey,
                    newKey = guid,
                    character = existingCharacter,
                    identityKey = identityKey,
                })
            elseif guid ~= "" then
                AzerCompanionDB.characterAliases[identityKey] = guid
            end
        end
    end

    for _, migration in ipairs(migrations) do
        local target = AzerCompanionDB.characters[migration.newKey]
        if type(target) ~= "table" then
            AzerCompanionDB.characters[migration.newKey] = migration.character
        elseif target ~= migration.character then
            -- Ne jamais écraser une entrée existante : complète uniquement les champs absents.
            for key, value in pairs(migration.character) do
                if target[key] == nil then
                    target[key] = value
                end
            end
        end
        AzerCompanionDB.characterAliases[migration.identityKey] = migration.newKey
        AzerCompanionDB.characters[migration.oldKey] = nil
    end
end

function Collector:GetCurrentCharacter()
    self:InitializeDatabase()
    local identity = self.Utils.PlayerIdentity()
    if not identity then return nil end

    local identityKey = normalizeIdentityKey(identity.name, identity.realm)
    local canonicalKey = identity.guid

    if not canonicalKey or canonicalKey == "" then
        canonicalKey = AzerCompanionDB.characterAliases[identityKey] or ("character:" .. identityKey)
    end

    local character = AzerCompanionDB.characters[canonicalKey]

    if type(character) ~= "table" then
        local aliasedKey = AzerCompanionDB.characterAliases[identityKey]
        if aliasedKey then
            character = AzerCompanionDB.characters[aliasedKey]
        end
    end

    if type(character) ~= "table" then
        for existingKey, existingCharacter in pairs(AzerCompanionDB.characters) do
            if type(existingCharacter) == "table" then
                local sameGuid = identity.guid and identity.guid ~= "" and existingCharacter.guid == identity.guid
                local sameIdentity = normalizeIdentityKey(existingCharacter.name, existingCharacter.realm) == identityKey
                if sameGuid or sameIdentity then
                    character = existingCharacter
                    if existingKey ~= canonicalKey then
                        AzerCompanionDB.characters[canonicalKey] = character
                        AzerCompanionDB.characters[existingKey] = nil
                    end
                    break
                end
            end
        end
    end

    if type(character) ~= "table" then
        character = {
            guid = identity.guid,
            firstSeenAt = self.Utils.Now(),
            sessions = {},
            achievements = {},
            quests = { active = {}, completedObserved = {} },
        }
        AzerCompanionDB.characters[canonicalKey] = character
    end

    character.storageKey = canonicalKey
    character.guid = identity.guid or character.guid
    character.name = identity.name
    character.realm = identity.realm
    character.key = identityKey
    character.achievements = character.achievements or {}
    character.quests = character.quests or {}
    character.quests.active = character.quests.active or {}
    character.quests.completedObserved = character.quests.completedObserved or {}
    character.quests.completedHistory = character.quests.completedHistory or {}
    character.quests.completedAccountShared = character.quests.completedAccountShared or {}

    AzerCompanionDB.characterAliases[identityKey] = canonicalKey
    AzerCompanionDB.account.lastCharacterGuid = character.guid
    AzerCompanionDB.account.lastCharacterKey = identityKey
    AzerCompanionDB.account.lastCharacterStorageKey = canonicalKey

    return character
end


function Collector:RecordCharacterWrite(stage, character, identity)
    self:InitializeDatabase()
    local storageKey = character and character.storageKey or (identity and identity.storageKey)
    local entryExists = storageKey and type(AzerCompanionDB.characters[storageKey]) == "table" or false
    local record = {
        at = self.Utils.Now(),
        stage = stage,
        guid = identity and identity.guid or (character and character.guid),
        name = identity and identity.name or (character and character.name),
        realm = identity and identity.realm or (character and character.realm),
        storageKey = storageKey,
        identityKey = character and character.key or (identity and identity.key),
        entryExists = entryExists,
        characterCount = 0,
    }
    for _ in pairs(AzerCompanionDB.characters or {}) do
        record.characterCount = record.characterCount + 1
    end
    table.insert(AzerCompanionDB.diagnostics.characterWrites, record)
    self.Utils.TrimArray(AzerCompanionDB.diagnostics.characterWrites, 50)
    AzerCompanionDB.diagnostics.lastCharacterWrite = record
    return record
end

function Collector:VerifyCurrentCharacter(stage)
    local identity = self.Utils.PlayerIdentity()
    if not identity then
        return nil, "Identité du personnage indisponible"
    end
    local character = self:GetCurrentCharacter()
    if not character then
        return nil, "Entrée du personnage indisponible"
    end
    local record = self:RecordCharacterWrite(stage or "verify", character, identity)
    return record, nil
end

function Collector:RegisterModule(name, module)
    if type(name) ~= "string" or type(module) ~= "table" then return end
    if not self.modules[name] then table.insert(self.moduleOrder, name) end
    module.name = name
    self.modules[name] = module
end

function Collector:RunModuleScan(index, options)
    local moduleName = self.moduleOrder[index]
    if not moduleName then self:FinishScan() return end
    local module = self.modules[moduleName]
    self.scanState.currentModule = moduleName
    self:Log("Analyse: " .. moduleName)

    local function done(result)
        self.scanState.results[moduleName] = result or { ok = true }
        self:RunModuleScan(index + 1, options)
    end

    if module and type(module.Scan) == "function" then
        local ok, errorMessage = pcall(module.Scan, module, options or {}, done)
        if not ok then
            self.scanState.results[moduleName] = { ok = false, error = tostring(errorMessage) }
            self:RunModuleScan(index + 1, options)
        end
    else
        done({ ok = true, skipped = true })
    end
end

function Collector:Scan(options)
    if self.scanState.running then self:Log("Une analyse est déjà en cours.") return end
    self:InitializeDatabase()
    local scanCharacter = self:GetCurrentCharacter()
    self:RecordCharacterWrite("scan-start", scanCharacter, self.Utils.PlayerIdentity())
    self.scanState = {
        running = true,
        startedAt = self.Utils.Now(),
        finishedAt = nil,
        currentModule = nil,
        results = {},
    }
    self:Log("Début de l'analyse Collector 2.0...")
    self:RunModuleScan(1, options or {})
end

function Collector:FinishScan()
    local finishedAt = self.Utils.Now()
    self.scanState.running = false
    self.scanState.finishedAt = finishedAt
    self.scanState.currentModule = nil
    AzerCompanionDB.sync.lastScanAt = finishedAt
    AzerCompanionDB.sync.lastScanStartedAt = self.scanState.startedAt
    AzerCompanionDB.sync.lastScanResults = self.scanState.results
    AzerCompanionDB.account.updatedAt = finishedAt
    local finishedCharacter = self:GetCurrentCharacter()
    self:RecordCharacterWrite("scan-finish", finishedCharacter, self.Utils.PlayerIdentity())
    table.insert(AzerCompanionDB.sync.history, {
        startedAt = self.scanState.startedAt,
        finishedAt = finishedAt,
        results = self.scanState.results,
    })
    self.Utils.TrimArray(AzerCompanionDB.sync.history, 20)
    self:Log("Analyse terminée. Les données seront enregistrées à la déconnexion ou au /reload.")
end

function Collector:DispatchEvent(event, ...)
    for _, moduleName in ipairs(self.moduleOrder) do
        local module = self.modules[moduleName]
        if module and type(module.OnEvent) == "function" then
            local ok, errorMessage = pcall(module.OnEvent, module, event, ...)
            if not ok then self:Log(moduleName .. ": " .. tostring(errorMessage)) end
        end
    end
end

eventFrame:SetScript("OnEvent", function(_, event, ...)
    if event == "ADDON_LOADED" then
        local loadedAddonName = ...
        if loadedAddonName ~= addonName then return end
        Collector:InitializeDatabase()
        Collector:DispatchEvent(event, ...)
        return
    end
    Collector:DispatchEvent(event, ...)
end)

for _, eventName in ipairs({
    "ADDON_LOADED", "PLAYER_LOGIN", "PLAYER_LOGOUT", "PLAYER_ENTERING_WORLD",
    "PLAYER_LEVEL_UP", "PLAYER_SPECIALIZATION_CHANGED", "PLAYER_EQUIPMENT_CHANGED",
    "SKILL_LINES_CHANGED", "PLAYER_MONEY", "ACHIEVEMENT_EARNED", "QUEST_LOG_UPDATE",
    "QUEST_TURNED_IN", "QUEST_DATA_LOAD_RESULT", "ZONE_CHANGED", "ZONE_CHANGED_INDOORS", "ZONE_CHANGED_NEW_AREA",
}) do
    eventFrame:RegisterEvent(eventName)
end
