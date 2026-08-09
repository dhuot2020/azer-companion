local addonName, Collector = ...
local Module = {}

local SLOT_NAMES = {
    [1] = "head", [2] = "neck", [3] = "shoulder", [4] = "shirt",
    [5] = "chest", [6] = "waist", [7] = "legs", [8] = "feet",
    [9] = "wrist", [10] = "hands", [11] = "finger1", [12] = "finger2",
    [13] = "trinket1", [14] = "trinket2", [15] = "back",
    [16] = "mainHand", [17] = "offHand", [19] = "tabard",
}

local refreshScheduled = false

local function requestItemData(itemID)
    if itemID and C_Item and C_Item.RequestLoadItemDataByID then
        pcall(C_Item.RequestLoadItemDataByID, itemID)
    end
end

local function splitItemLink(itemLink)
    if type(itemLink) ~= "string" then
        return nil
    end

    local payload = itemLink:match("item:([%d:%-]+)")
    if not payload then
        return nil
    end

    local values = {}
    for value in string.gmatch(payload .. ":", "([^:]*):") do
        table.insert(values, tonumber(value) or 0)
    end

    local gemCount = tonumber(values[13]) or 0
    local bonusCountIndex = 14 + gemCount
    local bonusCount = tonumber(values[bonusCountIndex]) or 0
    local bonusIDs = {}
    for index = 1, bonusCount do
        local bonusID = tonumber(values[bonusCountIndex + index]) or 0
        if bonusID > 0 then
            table.insert(bonusIDs, bonusID)
        end
    end

    return {
        itemID = tonumber(values[1]) or 0,
        enchantID = tonumber(values[2]) or 0,
        gemIDs = {
            tonumber(values[3]) or 0,
            tonumber(values[4]) or 0,
            tonumber(values[5]) or 0,
            tonumber(values[6]) or 0,
        },
        suffixID = tonumber(values[7]) or 0,
        uniqueID = tonumber(values[8]) or 0,
        linkLevel = tonumber(values[9]) or 0,
        specializationID = tonumber(values[10]) or 0,
        upgradeTypeID = tonumber(values[11]) or 0,
        instanceDifficultyID = tonumber(values[12]) or 0,
        bonusIDs = bonusIDs,
    }
end

local function getTransmogInfo(slotID)
    if not C_Transmog or not C_Transmog.GetSlotVisualInfo then
        return nil
    end

    local ok, baseSourceID, baseVisualID, appliedSourceID, appliedVisualID = pcall(
        C_Transmog.GetSlotVisualInfo,
        slotID
    )
    if not ok then
        return nil
    end

    return {
        baseSourceID = tonumber(baseSourceID) or 0,
        baseVisualID = tonumber(baseVisualID) or 0,
        appliedSourceID = tonumber(appliedSourceID) or 0,
        appliedVisualID = tonumber(appliedVisualID) or 0,
    }
end


local function colorToTable(color)
    if type(color) ~= "table" then
        return nil
    end
    return {
        r = tonumber(color.r) or 1,
        g = tonumber(color.g) or 1,
        b = tonumber(color.b) or 1,
        a = tonumber(color.a) or 1,
    }
end

local function readTooltipLines(tooltipData)
    local lines = {}
    if not tooltipData or type(tooltipData.lines) ~= "table" then
        return lines
    end

    -- Certaines lignes modernes stockent encore leurs textes dans `args`.
    -- SurfaceArgs remplit leftText/rightText avant la sérialisation.
    if TooltipUtil and TooltipUtil.SurfaceArgs then
        pcall(TooltipUtil.SurfaceArgs, tooltipData)
    end

    for _, line in ipairs(tooltipData.lines) do
        local leftText = line.leftText
        local rightText = line.rightText
        if (type(leftText) == "string" and leftText ~= "") or (type(rightText) == "string" and rightText ~= "") then
            table.insert(lines, {
                leftText = leftText,
                rightText = rightText,
                leftColor = colorToTable(line.leftColor),
                rightColor = colorToTable(line.rightColor),
            })
        end
    end
    return lines
end

local function captureTooltipLines(slotID, itemLink)
    local best = {}
    if not C_TooltipInfo then
        return best
    end

    if C_TooltipInfo.GetInventoryItem then
        local ok, data = pcall(C_TooltipInfo.GetInventoryItem, "player", slotID)
        if ok then
            local lines = readTooltipLines(data)
            if #lines > #best then best = lines end
        end
    end

    -- Sur certains objets, GetHyperlink expose davantage de lignes que
    -- GetInventoryItem (stats, durabilite, texte d'effet, etc.).
    if itemLink and C_TooltipInfo.GetHyperlink then
        local ok, data = pcall(C_TooltipInfo.GetHyperlink, itemLink)
        if ok then
            local lines = readTooltipLines(data)
            if #lines > #best then best = lines end
        end
    end

    return best
end

local function captureSlot(slotID, slotName)
    local itemID = GetInventoryItemID and GetInventoryItemID("player", slotID) or nil
    local itemLink = GetInventoryItemLink and GetInventoryItemLink("player", slotID) or nil
    local texture = GetInventoryItemTexture and GetInventoryItemTexture("player", slotID) or nil

    if not itemID and not itemLink then
        return {
            slotID = slotID,
            slotName = slotName,
            equipped = false,
        }
    end

    -- GetItemInfo, GetItemStats et C_TooltipInfo peuvent être incomplets au
    -- premier passage. La requête déclenche ITEM_DATA_LOAD_RESULT lorsque les
    -- informations détaillées deviennent disponibles dans le cache du client.
    requestItemData(itemID)

    local itemQuery = itemLink or ("item:" .. tostring(itemID or 0))
    local getItemInfo = C_Item and C_Item.GetItemInfo or GetItemInfo
    local itemName, _, quality, itemLevel, minLevel, itemType, itemSubType, stackCount, equipLocation, icon, sellPrice, classID, subclassID, bindType
    if getItemInfo then
        itemName, _, quality, itemLevel, minLevel, itemType, itemSubType, stackCount, equipLocation, icon, sellPrice, classID, subclassID, bindType = getItemInfo(itemQuery)
    end
    local getDetailedItemLevelInfo = C_Item and C_Item.GetDetailedItemLevelInfo or GetDetailedItemLevelInfo
    local detailedItemLevel = getDetailedItemLevelInfo and getDetailedItemLevelInfo(itemQuery) or nil
    local parsed = splitItemLink(itemLink) or {}
    local transmog = getTransmogInfo(slotID)

    local stats = {}
    local getItemStats = C_Item and C_Item.GetItemStats or GetItemStats
    if getItemStats then
        local rawStats = getItemStats(itemQuery) or {}
        for statName, statValue in pairs(rawStats) do
            stats[statName] = tonumber(statValue) or statValue
        end
    end

    local tooltipLines = captureTooltipLines(slotID, itemLink)

    local durabilityCurrent, durabilityMax = 0, 0
    if GetInventoryItemDurability then
        local current, maximum = GetInventoryItemDurability(slotID)
        durabilityCurrent = tonumber(current) or 0
        durabilityMax = tonumber(maximum) or 0
    end

    return {
        slotID = slotID,
        slotName = slotName,
        equipped = true,
        itemID = tonumber(itemID or parsed.itemID) or 0,
        itemLink = itemLink,
        itemName = itemName,
        quality = tonumber(quality) or 0,
        itemLevel = tonumber(detailedItemLevel or itemLevel) or 0,
        itemType = itemType,
        itemSubType = itemSubType,
        equipLocation = equipLocation,
        icon = icon or texture,
        minLevel = tonumber(minLevel) or 0,
        sellPrice = tonumber(sellPrice) or 0,
        bindType = tonumber(bindType) or 0,
        classID = tonumber(classID) or 0,
        subclassID = tonumber(subclassID) or 0,
        stackCount = tonumber(stackCount) or 0,
        stats = stats,
        tooltipLines = tooltipLines,
        durabilityCurrent = durabilityCurrent,
        durabilityMax = durabilityMax,
        enchantID = tonumber(parsed.enchantID) or 0,
        gemIDs = parsed.gemIDs or {},
        bonusIDs = parsed.bonusIDs or {},
        suffixID = tonumber(parsed.suffixID) or 0,
        specializationID = tonumber(parsed.specializationID) or 0,
        upgradeTypeID = tonumber(parsed.upgradeTypeID) or 0,
        instanceDifficultyID = tonumber(parsed.instanceDifficultyID) or 0,
        transmog = transmog,
    }
end

local function captureEquipment(character)
    local slots = {}
    local equippedCount = 0
    local itemLevelTotal = 0
    local itemLevelCount = 0

    for slotID, slotName in pairs(SLOT_NAMES) do
        local slot = captureSlot(slotID, slotName)
        slots[slotName] = slot
        if slot.equipped then
            equippedCount = equippedCount + 1
            if (slot.itemLevel or 0) > 0 then
                itemLevelTotal = itemLevelTotal + slot.itemLevel
                itemLevelCount = itemLevelCount + 1
            end
        end
    end

    local averageItemLevel, equippedItemLevel, pvpItemLevel
    if GetAverageItemLevel then
        averageItemLevel, equippedItemLevel, pvpItemLevel = GetAverageItemLevel()
    end

    character.equipment = {
        schemaVersion = 3,
        slots = slots,
        equippedCount = equippedCount,
        averageItemLevel = tonumber(averageItemLevel) or 0,
        equippedItemLevel = tonumber(equippedItemLevel) or 0,
        pvpItemLevel = tonumber(pvpItemLevel) or 0,
        calculatedItemLevel = itemLevelCount > 0 and (itemLevelTotal / itemLevelCount) or 0,
        capturedAt = Collector.Utils.Now(),
    }

    character.hero = character.hero or {}
    character.hero.schemaVersion = 1
    character.hero.updatedAt = Collector.Utils.Now()
    character.hero.equipment = {
        equippedCount = equippedCount,
        equippedItemLevel = tonumber(equippedItemLevel) or 0,
        capturedAt = character.equipment.capturedAt,
    }
end

local function isEquippedItem(itemID)
    itemID = tonumber(itemID) or 0
    if itemID <= 0 or not GetInventoryItemID then
        return false
    end

    for slotID in pairs(SLOT_NAMES) do
        -- Stocker d'abord le résultat évite que les valeurs de retour
        -- supplémentaires soient transmises à tonumber comme second argument.
        local equippedItemID = GetInventoryItemID("player", slotID)
        if tonumber(equippedItemID) == itemID then
            return true
        end
    end

    return false
end

local function refreshEquipmentAfterItemLoad(delay)
    if refreshScheduled then
        return
    end

    local function refresh()
        refreshScheduled = false
        local character = Collector:GetCurrentCharacter()
        if not character then
            return
        end
        captureEquipment(character)
        Collector:RecordCharacterWrite(
            "equipment-item-data-loaded",
            character,
            Collector.Utils.PlayerIdentity()
        )
    end

    refreshScheduled = true
    if C_Timer and C_Timer.After then
        C_Timer.After(tonumber(delay) or 0.25, refresh)
    else
        refresh()
    end
end

function Module:Scan(_, done)
    local character = Collector:GetCurrentCharacter()
    if not character then
        done({ ok = false, error = "Personnage indisponible" })
        return
    end

    -- Premier passage : demande le chargement de chaque objet. Le second
    -- passage laisse au cache WoW le temps de fournir stats et tooltip complet
    -- avant que le module Export ne sérialise la base SavedVariables.
    captureEquipment(character)

    local function finishScan()
        captureEquipment(character)
        Collector:RecordCharacterWrite("equipment-module", character, Collector.Utils.PlayerIdentity())
        done({
            ok = true,
            characterKey = character.key,
            equippedCount = character.equipment and character.equipment.equippedCount or 0,
        })
    end

    if C_Timer and C_Timer.After then
        C_Timer.After(0.5, finishScan)
    else
        finishScan()
    end
end

function Module:OnEvent(event, itemID, success)
    if event == "PLAYER_LOGIN" or event == "PLAYER_ENTERING_WORLD" or event == "PLAYER_EQUIPMENT_CHANGED" then
        local character = Collector:GetCurrentCharacter()
        if character then
            captureEquipment(character)
            refreshEquipmentAfterItemLoad(event == "PLAYER_EQUIPMENT_CHANGED" and 0.35 or 1)
        end
        return
    end

    if (event == "GET_ITEM_INFO_RECEIVED" or event == "ITEM_DATA_LOAD_RESULT")
        and success ~= false
        and isEquippedItem(itemID) then
        refreshEquipmentAfterItemLoad(0.15)
    end
end

Collector:RegisterModule("Equipment", Module)
