local addonName, Collector = ...
local Module = {}

local previewFrame
local previewModel
local previewPortrait
local previewName
local previewDetails

local function captureMedia(character)
    if not character then return end

    local displayID = UnitCreatureDisplayID and UnitCreatureDisplayID("player") or nil
    local guid = UnitGUID("player")

    character.media = character.media or {}
    character.media.unitGUID = guid
    character.media.displayID = displayID
    character.media.portraitAvailableInClient = true
    character.media.modelAvailableInClient = displayID ~= nil
    character.media.captureMethod = "wow-client-unit"
    character.media.capturedAt = Collector.Utils.Now()

    if character.appearance then
        character.media.portraitKey = character.appearance.portraitKey
        character.media.portraitSlug = character.appearance.portraitSlug
    end
end

local function ensurePreviewFrame()
    if previewFrame then return previewFrame end

    previewFrame = CreateFrame("Frame", "AzerCompanionPortraitPreview", UIParent, "BackdropTemplate")
    previewFrame:SetSize(430, 620)
    previewFrame:SetPoint("CENTER")
    previewFrame:SetFrameStrata("DIALOG")
    previewFrame:SetClampedToScreen(true)
    previewFrame:EnableMouse(true)
    previewFrame:SetMovable(true)
    previewFrame:RegisterForDrag("LeftButton")
    previewFrame:SetScript("OnDragStart", previewFrame.StartMoving)
    previewFrame:SetScript("OnDragStop", previewFrame.StopMovingOrSizing)
    previewFrame:SetBackdrop({
        bgFile = "Interface\\DialogFrame\\UI-DialogBox-Background-Dark",
        edgeFile = "Interface\\DialogFrame\\UI-DialogBox-Border",
        tile = true,
        tileSize = 32,
        edgeSize = 24,
        insets = { left = 7, right = 7, top = 7, bottom = 7 },
    })

    previewName = previewFrame:CreateFontString(nil, "OVERLAY", "GameFontNormalHuge")
    previewName:SetPoint("TOP", 0, -22)

    previewDetails = previewFrame:CreateFontString(nil, "OVERLAY", "GameFontHighlight")
    previewDetails:SetPoint("TOP", previewName, "BOTTOM", 0, -7)

    previewPortrait = previewFrame:CreateTexture(nil, "ARTWORK")
    previewPortrait:SetSize(92, 92)
    previewPortrait:SetPoint("TOPLEFT", 28, -70)
    previewPortrait:SetMask("Interface\\CharacterFrame\\TempPortraitAlphaMask")

    previewModel = CreateFrame("PlayerModel", nil, previewFrame)
    previewModel:SetPoint("TOPLEFT", 20, -175)
    previewModel:SetPoint("BOTTOMRIGHT", -20, 55)
    previewModel:SetUnit("player")
    previewModel:SetPortraitZoom(0.05)
    previewModel:SetCamDistanceScale(1.15)
    previewModel:SetRotation(0)

    local close = CreateFrame("Button", nil, previewFrame, "UIPanelCloseButton")
    close:SetPoint("TOPRIGHT", -6, -6)

    local help = previewFrame:CreateFontString(nil, "OVERLAY", "GameFontDisableSmall")
    help:SetPoint("BOTTOM", 0, 24)
    help:SetText("/azer portrait screenshot pour enregistrer cette vue")

    previewFrame:Hide()
    return previewFrame
end

function Collector:ShowPortraitPreview(takeScreenshot)
    local character = self:GetCurrentCharacter()
    if not character then
        self:Log("Personnage indisponible pour le portrait.")
        return
    end

    captureMedia(character)
    local frame = ensurePreviewFrame()
    local profile = character.profile or {}
    local appearance = character.appearance or {}

    previewName:SetText(tostring(character.name or UnitName("player") or "Personnage"))
    previewDetails:SetText(string.format(
        "%s %s - Niveau %s - DisplayID %s",
        tostring(appearance.raceName or profile.raceName or "Race inconnue"),
        tostring(appearance.className or profile.className or "Classe inconnue"),
        tostring(profile.level or UnitLevel("player") or "?"),
        tostring(appearance.displayID or character.media.displayID or "indisponible")
    ))

    SetPortraitTexture(previewPortrait, "player")
    previewModel:ClearModel()
    previewModel:SetUnit("player")
    previewModel:SetPortraitZoom(0.05)
    previewModel:SetCamDistanceScale(1.15)
    previewModel:SetRotation(0)
    frame:Show()

    self:RecordCharacterWrite("portrait-preview", character, self.Utils.PlayerIdentity())

    if takeScreenshot then
        C_Timer.After(0.8, function()
            if Screenshot then
                Screenshot()
                Collector:Log("Capture demandée. Vérifiez World of Warcraft\\_retail_\\Screenshots.")
            else
                Collector:Log("La fonction Screenshot n'est pas disponible dans ce client.")
            end
        end)
    else
        self:Log("Aperçu du vrai personnage affiché. Utilisez /azer portrait screenshot pour enregistrer une image.")
    end
end

function Module:Scan(_, done)
    local character = Collector:GetCurrentCharacter()
    if not character then
        done({ ok = false, error = "Personnage indisponible" })
        return
    end

    captureMedia(character)
    done({
        ok = true,
        displayID = character.media and character.media.displayID,
        portraitKey = character.media and character.media.portraitKey,
    })
end

function Module:OnEvent(event)
    if event == "PLAYER_LOGIN" or event == "PLAYER_ENTERING_WORLD" or event == "UNIT_MODEL_CHANGED" then
        local character = Collector:GetCurrentCharacter()
        if character then captureMedia(character) end
    end
end

Collector:RegisterModule("Media", Module)
