local addonName, Collector = ...

local function printStatus()
    Collector:InitializeDatabase()
    local characterCount = 0
    for _ in pairs(AzerCompanionDB.characters or {}) do
        characterCount = characterCount + 1
    end

    local achievementSummary = AzerCompanionDB.account.achievementSummary or {}
    Collector:Log(string.format(
        "%d personnage(s), %d haut(s) fait(s) complété(s), dernier scan: %s",
        characterCount,
        achievementSummary.completed or 0,
        AzerCompanionDB.sync.lastScanAt and date("%Y-%m-%d %H:%M:%S", AzerCompanionDB.sync.lastScanAt) or "jamais"
    ))

    local names = {}
    for _, character in pairs(AzerCompanionDB.characters or {}) do
        if type(character) == "table" then
            table.insert(names, string.format(
                "%s-%s [%s]",
                tostring(character.name or "Inconnu"),
                tostring(character.realm or "Inconnu"),
                tostring(character.guid or character.storageKey or "sans GUID")
            ))
        end
    end
    table.sort(names)
    if #names > 0 then
        Collector:Log("Personnages enregistrés: " .. table.concat(names, ", "))
    end
end

SLASH_AZERCOMPANION1 = "/azer"
SlashCmdList.AZERCOMPANION = function(message)
    local command = string.lower((message or ""):match("^%s*(.-)%s*$"))

    if command == "scan" or command == "sync" then
        Collector:Scan({ full = true })
    elseif command == "status" then
        Collector:GetCurrentCharacter()
        printStatus()
    elseif command == "who" then
        local character = Collector:GetCurrentCharacter()
        if character then
            Collector:Log(string.format(
                "Personnage courant: %s-%s | GUID: %s | clé: %s",
                tostring(character.name),
                tostring(character.realm),
                tostring(character.guid or "indisponible"),
                tostring(character.storageKey or character.key or "indisponible")
            ))
        else
            Collector:Log("Impossible d'identifier le personnage courant.")
        end
    elseif command == "verify" then
        local record, errorMessage = Collector:VerifyCurrentCharacter("manual-verify")
        if not record then
            Collector:Log("Vérification impossible: " .. tostring(errorMessage))
        else
            Collector:Log(string.format(
                "Vérification: %s-%s | GUID: %s | stockage: %s | présent: %s | total: %d",
                tostring(record.name or "Inconnu"),
                tostring(record.realm or "Inconnu"),
                tostring(record.guid or "sans GUID"),
                tostring(record.storageKey or "sans clé"),
                record.entryExists and "OUI" or "NON",
                tonumber(record.characterCount or 0)
            ))
        end
    elseif command == "diag" then
        Collector:InitializeDatabase()
        local record = AzerCompanionDB.diagnostics and AzerCompanionDB.diagnostics.lastCharacterWrite
        if record then
            Collector:Log(string.format(
                "Dernière écriture: %s | %s-%s | %s | présent: %s | total: %d",
                tostring(record.stage or "inconnu"),
                tostring(record.name or "Inconnu"),
                tostring(record.realm or "Inconnu"),
                tostring(record.storageKey or "sans clé"),
                record.entryExists and "OUI" or "NON",
                tonumber(record.characterCount or 0)
            ))
        else
            Collector:Log("Aucun diagnostic d'écriture disponible.")
        end
    elseif command == "portrait" then
        Collector:ShowPortraitPreview(false)
    elseif command == "portrait screenshot" or command == "portrait capture" then
        Collector:ShowPortraitPreview(true)
    elseif command == "export" then
        Collector:InitializeDatabase()
        AzerCompanionDB.sync.exportRequestedAt = Collector.Utils.Now()
        Collector:VerifyCurrentCharacter("export")
        Collector:Log("Données prêtes. Faites /reload ou déconnectez-vous pour écrire SavedVariables.")
    else
        Collector:Log("Commandes: /azer scan, /azer portrait, /azer portrait screenshot, /azer status, /azer who, /azer verify, /azer diag, /azer export")
    end
end
