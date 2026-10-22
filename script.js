(() => {
    'use strict';

    const canvas = document.getElementById('city-canvas');
    const THREE = window.THREE;
    let renderer;
    let scene;
    let camera;
    let playerMesh;
    let playerKartMesh;
    let parkedKartMesh;
    let pedestrians = [];
    let trafficCars = [];
    let roadPaths = [];
    const keys = new Set();
    const ui = {
        simulator: document.getElementById('city-simulator'),
        startScreen: document.getElementById('start-screen'),
        startButton: document.getElementById('start-story'),
        storyObjective: document.getElementById('story-objective'),
        cityKpis: document.getElementById('city-kpis'),
        interactionPrompt: document.getElementById('interaction-prompt'),
        interactionLabel: document.getElementById('interaction-label'),
        toast: document.getElementById('toast'),
        periodLabel: document.getElementById('period-label'),
        hqPanel: document.getElementById('hq-panel'),
        recruitmentPanel: document.getElementById('recruitment-panel'),
        bankPanel: document.getElementById('bank-panel'),
        marketingPanel: document.getElementById('marketing-panel'),
        servicePanel: document.getElementById('service-panel'),
        eventPanel: document.getElementById('event-panel'),
        debriefPanel: document.getElementById('debrief-panel'),
        pausePanel: document.getElementById('pause-panel'),
        panelBackdrop: document.getElementById('panel-backdrop'),
        phaseTitle: document.getElementById('phase-title'),
        phaseKicker: document.getElementById('phase-kicker'),
        phaseObjective: document.getElementById('phase-objective'),
        phaseActivities: document.getElementById('phase-activities'),
        phaseKpis: document.getElementById('phase-kpis'),
        phaseTarget: document.getElementById('phase-target'),
        phaseValidationStatus: document.getElementById('phase-validation-status'),
        validatePhase: document.getElementById('validate-phase'),
        phaseAction: document.getElementById('phase-action'),
        marketingAllocation: document.getElementById('marketing-allocation'),
        marketingAllocationValue: document.getElementById('marketing-allocation-value'),
        coachingAllocation: document.getElementById('coaching-allocation'),
        coachingAllocationValue: document.getElementById('coaching-allocation-value'),
        eventTitle: document.getElementById('event-title'),
        eventType: document.getElementById('event-type'),
        eventContext: document.getElementById('event-context'),
        eventChoices: document.getElementById('event-choices'),
        eventFeedback: document.getElementById('event-feedback'),
        debriefReport: document.getElementById('debrief-kpis'),
        funnelSummary: document.getElementById('funnel-summary'),
        decisionLog: document.getElementById('decision-log')
    };

    const world = { width: 2400, height: 1600 };
    const mapBuildings = [
        { id: 'recruitment', name: 'AGENCE RECRUTEMENT', subtitle: 'Talents · Intérim · SDR / AE / CS', x: 320, y: 275, w: 210, h: 140, color: '#d0db83', accent: '#d9ff66' },
        { id: 'bank', name: 'BANQUE & INVESTISSEURS', subtitle: 'Trésorerie · Crédit · Financement', x: 1780, y: 275, w: 225, h: 140, color: '#80bfc1', accent: '#61c9d2' },
        { id: 'hq', name: 'SIÈGE SOCIAL', subtitle: 'Dashboard · Funnel · Ressources', x: 1065, y: 570, w: 270, h: 185, color: '#e5d17d', accent: '#e7c75c' },
        { id: 'marketing', name: 'AGENCE COMMUNICATION', subtitle: 'Campagnes · Acquisition · Leads', x: 1770, y: 1130, w: 230, h: 150, color: '#e59678', accent: '#ff7659' },
        { id: 'service', name: 'CENTRE SERVICE CLIENT', subtitle: 'Support · Rétention · NPS', x: 340, y: 1110, w: 230, h: 150, color: '#98c9a0', accent: '#a9e85c' }
    ];

    const phases = [
        { id: 'awareness', name: 'Notoriété', kicker: 'PHASE 01 · ACQUISITION', objective: "Faire connaître l'offre auprès des bons comptes.", activities: 'Référencement, publicité, réseaux sociaux, événements.', kpis: 'Visiteurs, impressions, coût par visiteur.', action: 'ACTIVER LA CAMPAGNE DE NOTORIÉTÉ' },
        { id: 'interest', name: 'Intérêt', kicker: 'PHASE 02 · GÉNÉRATION DE DEMANDE', objective: "Transformer l'audience en leads exploitables.", activities: 'Contenus, livres blancs, webinaires, formulaires.', kpis: 'Leads, CPL, conversion visiteur → lead.', action: 'PUBLIER UN CONTENU DE CONVERSION' },
        { id: 'consideration', name: 'Considération', kicker: 'PHASE 03 · QUALIFICATION', objective: 'Repérer les leads sérieux et prioriser les rendez-vous.', activities: 'Qualification, démonstrations, scoring.', kpis: 'Taux de qualification, rendez-vous obtenus.', action: 'QUALIFIER LE PIPELINE' },
        { id: 'decision', name: 'Décision', kicker: 'PHASE 04 · CLOSING', objective: 'Signer des clients sans dégrader la marge.', activities: 'Propositions, négociation, relances.', kpis: 'Taux de closing, CPA, cycle de vente, panier moyen.', action: 'TRAVAILLER LES OPPORTUNITÉS' },
        { id: 'loyalty', name: 'Fidélisation', kicker: 'PHASE 05 · VALEUR CLIENT', objective: 'Garder, développer et faire recommander les clients.', activities: 'Onboarding, suivi, enquêtes, ventes additionnelles.', kpis: 'Rétention, churn, CLV, NPS.', action: 'LANCER UN PLAN DE FIDÉLISATION' }
    ];

    const phaseGoals = [
        { target: 'Atteindre 2 000 visiteurs', reached: () => metrics.visitors >= 2000 },
        { target: 'Générer au moins 16 leads dans le pipeline', reached: () => metrics.leads >= 16 },
        { target: 'Qualifier au moins 12 leads', reached: () => metrics.qualified >= 12 },
        { target: 'Signer au moins 2 ventes', reached: () => metrics.sales >= 2 },
        { target: 'Atteindre 90 % de rétention et un NPS de 50', reached: () => metrics.retention >= 90 && metrics.nps >= 50 }
    ];

    const state = {
        started: false,
        paused: false,
        inVehicle: false,
        player: { x: 850, y: 895, angle: -0.1, speed: 0 },
        car: { x: 955, y: 895, angle: -0.1 },
        camera: { x: 0, y: 0 },
        currentBuilding: null,
        panel: null,
        period: 1,
        year: 1,
        time: 0,
        tempCapacity: 0,
        tempPeriods: 0,
        newLeadsThisPeriod: 0,
        burnoutPeriods: 0,
        storyRecruitment: false,
        storyHired: false,
        lostLeads: 0,
        debt: 0,
        cash: 35000,
        marketingBudget: 5000,
        coachingDays: 2,
        selectedPhase: 'awareness',
        currentPhaseIndex: 0,
        validatedPhases: [],
        toastTimer: 0,
        lastFrame: 0,
        event: null,
        decisionCount: 0,
        campaignCount: 0,
        driveDistance: 0,
        playerFootstep: 0,
        boostTimer: 0,
        attritionTriggered: false,
        spent: 0,
        log: []
    };

    const metrics = {
        revenue: 50000,
        revenueGoal: 120000,
        margin: 32,
        motivation: 78,
        nps: 45,
        visitors: 1200,
        impressions: 12500,
        leads: 8,
        qualified: 0,
        meetings: 0,
        sales: 0,
        retention: 88,
        churn: 12,
        cpa: 0,
        averageTicket: 12000,
        pipeline: 8,
        qualifiedPipeline: 0,
        meetingsPipeline: 0
    };

    const team = [
        { name: 'Maya R.', role: 'SDR', core: true, salary: 5500, fatigue: 8 },
        { name: 'Noah P.', role: 'AE', core: true, salary: 7000, fatigue: 8 }
    ];

    const eventLibrary = [
        {
            type: 'NÉGOCIATION · COMPTE STRATÉGIQUE',
            title: 'Un grand compte exige 15 % de remise',
            context: 'La signature ferait progresser le CA, mais le rabais réduirait la marge. Le client ne s’engage pas encore sur un volume ferme.',
            choices: [
                { title: 'Accorder la remise pour signer maintenant', note: 'CA court terme en hausse, marge dégradée', effects: { revenue: 18000, sales: 1, margin: -7, motivation: 1 }, feedback: 'Le CA augmente immédiatement, mais 15 % de remise pèse sur chaque vente. À l’avenir, exigez une contrepartie mesurable : volume, durée ou paiement anticipé.' },
                { title: 'Conditionner la remise à un volume minimum', note: 'Protéger la valeur totale du contrat', effects: { revenue: 14500, sales: 1, margin: -2, leads: 1 }, feedback: 'Vous échangez le geste commercial contre un engagement. Évaluez la marge totale sur la durée du contrat, pas seulement le montant signé.' },
                { title: 'Défendre la valeur et proposer un pilote', note: 'Réduire le risque sans baisser le prix', effects: { revenue: 9000, margin: 2, nps: 2, meetings: 1 }, feedback: 'Le pilote apporte une preuve de valeur. Fixez son périmètre et des critères de succès avant de négocier le déploiement.' }
            ]
        },
        {
            type: 'RESSOURCES HUMAINES · SURCHARGE',
            title: 'Les deux commerciaux sont en surcharge',
            context: 'Le pipeline grossit plus vite que la capacité de qualification et de closing. Vous pouvez réduire les entrées, faire appel à un renfort ou demander un effort supplémentaire.',
            choices: [
                { title: 'Réduire temporairement les campagnes', note: 'Protéger la qualité et la motivation', effects: { motivation: 8, nps: 3, leads: -2 }, feedback: 'Ralentir l’acquisition aide l’équipe à traiter le stock actuel. C’est utile à court terme, mais investissez dans la capacité avant de relancer la croissance.' },
                { title: 'Financer un renfort intérimaire', note: 'Capacité rapide, coût ponctuel', effects: { cash: -4000, temp: 8, motivation: 3 }, feedback: 'L’intérim augmente la capacité sans créer une charge fixe durable. Comparez le coût par lead traité au coût d’un lead perdu.' },
                { title: 'Maintenir le rythme sans ajuster l’équipe', note: 'Aucune dépense immédiate, fatigue accrue', effects: { motivation: -12, nps: -6, lostLeads: 8 }, feedback: 'Le volume non traité devient du gaspillage marketing. La surcharge augmente aussi les erreurs et les départs : le coût humain doit entrer dans le calcul.' }
            ]
        },
        {
            type: 'SERVICE CLIENT · RISQUE DE CHURN',
            title: 'Un client important envisage de partir',
            context: 'Le client n’a pas perçu la valeur attendue depuis son onboarding. Il reste une fenêtre pour corriger l’expérience avant le renouvellement.',
            choices: [
                { title: 'Organiser un bilan de valeur avec un responsable dédié', note: 'Diagnostiquer l’irritant et sécuriser l’usage', effects: { nps: 12, retention: 8, motivation: 2 }, feedback: 'Le bilan met les résultats et les irritants à plat. Un plan d’action suivi améliore la rétention et protège la CLV.' },
                { title: 'Accorder un avoir sans traiter la cause', note: 'Soulager la tension, coût sur la marge', effects: { revenue: -3500, margin: -3, nps: 3 }, feedback: 'Un avoir apaise parfois, mais ne résout pas le problème. Vérifiez l’effet sur la marge et convenez d’un suivi de résolution.' },
                { title: 'Proposer immédiatement une option supérieure', note: 'Upsell risqué avant d’avoir rétabli la confiance', effects: { nps: -5, retention: -7, revenue: 6000 }, feedback: 'Une vente additionnelle prématurée peut accélérer le churn. Rétablissez d’abord l’adoption et la valeur perçue.' }
            ]
        }
    ];

    const campaigns = {
        reach: { cost: 8000, visitors: 500, leads: 7, qualified: 1, margin: -1, label: 'Campagne de notoriété' },
        targeted: { cost: 9000, visitors: 220, leads: 14, qualified: 5, margin: 1, label: 'Acquisition ciblée' },
        webinar: { cost: 6000, visitors: 180, leads: 8, qualified: 4, nps: 2, label: 'Webinaire expert' }
    };

    const phaseResults = {
        awareness: { actionCount: 0, visitors: 1200, impressions: 12500 },
        interest: { actionCount: 0, leads: 8, cost: 0 },
        consideration: { actionCount: 0, qualified: 0, meetings: 0 },
        decision: { actionCount: 0, sales: 0, cycleDays: 24 },
        loyalty: { actionCount: 0, retained: 0, churn: 4 }
    };

    function clamp(value, minimum, maximum) {
        return Math.max(minimum, Math.min(maximum, value));
    }

    function formatMoney(value) {
        return `${Math.round(value).toLocaleString('fr-FR')} €`;
    }

    function showToast(message, seconds = 4) {
        ui.toast.textContent = message;
        ui.toast.classList.add('toast-visible');
        state.toastTimer = seconds;
    }

    function updateStory() {
        if (state.storyHired) {
            ui.storyObjective.textContent = 'Croissance soutenue : pilotez le funnel et développez les comptes.';
        } else if (state.storyRecruitment) {
            ui.storyObjective.textContent = 'Mission : rendez-vous à l’agence et recrutez un renfort pour absorber le pipeline.';
        } else {
            const current = phases[state.currentPhaseIndex];
            ui.storyObjective.textContent = `ÉTAPE ${state.currentPhaseIndex + 1}/5 · ${current.name} : ${current.objective}`;
        }
        document.getElementById('recruitment-alert').classList.toggle('is-hidden', !state.storyRecruitment || state.storyHired);
    }

    function updateHud() {
        const revenueProgress = clamp(metrics.revenue / metrics.revenueGoal * 100, 0, 100);
        document.getElementById('hud-revenue').textContent = formatMoney(metrics.revenue);
        document.getElementById('hud-revenue-goal').textContent = formatMoney(metrics.revenueGoal);
        document.getElementById('hud-revenue-meter').style.width = `${revenueProgress}%`;
        document.getElementById('hud-margin').textContent = `${Math.round(metrics.margin)} %`;
        document.getElementById('hud-margin-meter').style.width = `${clamp(metrics.margin / 60 * 100, 0, 100)}%`;
        document.getElementById('hud-motivation').textContent = `${Math.round(metrics.motivation)} %`;
        document.getElementById('hud-motivation-meter').style.width = `${clamp(metrics.motivation, 0, 100)}%`;
        document.getElementById('hud-nps').textContent = `${metrics.nps > 0 ? '+' : ''}${Math.round(metrics.nps)}`;
        document.getElementById('hud-nps-meter').style.width = `${clamp((metrics.nps + 100) / 2, 0, 100)}%`;
        document.getElementById('hud-team').textContent = `${team.length} personne${team.length > 1 ? 's' : ''}`;
        document.getElementById('hud-cash').textContent = formatMoney(state.cash);
        ui.periodLabel.textContent = `ANNÉE ${state.year} · PÉRIODE ${state.period}`;
        updateStory();
    }

    function updatePhaseView() {
        const phase = phases.find((entry) => entry.id === state.selectedPhase);
        if (!phase) return;
        ui.phaseTitle.textContent = phase.name;
        ui.phaseKicker.textContent = phase.kicker;
        ui.phaseObjective.textContent = phase.objective;
        ui.phaseActivities.textContent = phase.activities;
        ui.phaseKpis.textContent = phase.kpis;
        ui.phaseAction.textContent = phase.action;
        document.querySelectorAll('.funnel-tab').forEach((button) => {
            button.classList.toggle('is-active', button.dataset.phase === state.selectedPhase);
        });
        document.getElementById('marketing-allocation').value = state.marketingBudget;
        document.getElementById('marketing-allocation-value').textContent = Number(state.marketingBudget).toLocaleString('fr-FR');
        document.getElementById('coaching-allocation').value = state.coachingDays;
        document.getElementById('coaching-allocation-value').textContent = String(state.coachingDays);
        const phaseIndex = phases.findIndex((entry) => entry.id === state.selectedPhase);
        const current = phaseIndex === state.currentPhaseIndex;
        const passed = phaseIndex < state.currentPhaseIndex;
        const goal = phaseGoals[phaseIndex];
        ui.phaseTarget.textContent = goal.target;
        ui.phaseValidationStatus.textContent = passed
            ? 'Étape déjà validée.'
            : current && goal.reached()
                ? 'Objectif atteint. Validez pour débloquer la phase suivante.'
                : current
                    ? 'Terminez les actions requises, puis validez cette étape.'
                    : 'Cette étape est verrouillée. Validez d’abord la phase en cours.';
        ui.validatePhase.disabled = !current || !goal.reached();
        ui.phaseAction.disabled = !current;
        document.querySelectorAll('.funnel-tab').forEach((button) => {
            const index = phases.findIndex((entry) => entry.id === button.dataset.phase);
            button.disabled = index > state.currentPhaseIndex;
            button.classList.toggle('is-locked', index > state.currentPhaseIndex);
            button.classList.toggle('is-validated', index < state.currentPhaseIndex);
        });
    }

    function renderTeam(targetId) {
        const target = document.getElementById(targetId);
        target.replaceChildren();
        for (const employee of team) {
            const row = document.createElement('div');
            row.className = 'staff-row';
            const badge = document.createElement('span');
            badge.className = `staff-role staff-role--${employee.role.toLowerCase()}`;
            badge.textContent = employee.role;
            const name = document.createElement('strong');
            name.textContent = employee.name;
            const fatigue = document.createElement('span');
            fatigue.className = 'staff-fatigue';
            fatigue.textContent = `Fatigue ${Math.round(employee.fatigue)} %`;
            row.append(badge, name, fatigue);
            target.appendChild(row);
        }
    }

    function updateDashboard() {
        metrics.retention = clamp(100 - metrics.churn, 0, 100);
        updatePhaseView();
        const sdr = team.filter((employee) => employee.role === 'SDR').length;
        const ae = team.filter((employee) => employee.role === 'AE').length;
        const cs = team.filter((employee) => employee.role === 'CS').length;
        const capacity = sdr * 8 + state.tempCapacity;
        document.getElementById('hq-cash').textContent = formatMoney(state.cash);
        document.getElementById('hq-pipeline').textContent = `${metrics.pipeline} leads · ${metrics.qualifiedPipeline} qualifiés`;
        document.getElementById('hq-capacity').textContent = `${capacity} leads · ${ae * 4} RDV`;
        document.getElementById('hq-lost').textContent = String(state.lostLeads);
        document.getElementById('recruitment-headcount').textContent = `${team.length} personnes`;
        renderTeam('hq-team-list');
        renderTeam('recruitment-team-list');
        document.getElementById('bank-cash').textContent = formatMoney(state.cash);
        document.getElementById('bank-debt').textContent = formatMoney(state.debt);
        document.getElementById('service-retention').textContent = `${Math.round(metrics.retention)} %`;
        document.getElementById('service-churn').textContent = `${Math.round(metrics.churn)} %`;
        document.getElementById('service-nps').textContent = `${metrics.nps > 0 ? '+' : ''}${Math.round(metrics.nps)}`;
        updateHud();
    }

    function openPanel(panelId) {
        closePanels();
        state.panel = panelId;
        document.getElementById(panelId).classList.remove('is-hidden');
        ui.panelBackdrop.classList.remove('is-hidden');
        if (panelId === 'hq-panel' || panelId === 'recruitment-panel' || panelId === 'bank-panel') updateDashboard();
        if (panelId === 'debrief-panel') updateDebrief();
        state.player.speed = 0;
        keys.clear();
    }

    function closePanels() {
        document.querySelectorAll('.business-panel').forEach((panel) => panel.classList.add('is-hidden'));
        ui.panelBackdrop.classList.add('is-hidden');
        state.panel = null;
    }

    function nearBuilding(building, x = state.player.x, y = state.player.y) {
        const dx = Math.max(Math.abs(x - (building.x + building.w / 2)) - building.w / 2, 0);
        const dy = Math.max(Math.abs(y - (building.y + building.h / 2)) - building.h / 2, 0);
        return Math.hypot(dx, dy);
    }

    function nearestBuilding() {
        return mapBuildings
            .map((building) => ({ building, distance: nearBuilding(building) }))
            .sort((first, second) => first.distance - second.distance)[0];
    }

    function canCollide(x, y) {
        for (const building of mapBuildings) {
            if (x > building.x - 24 && x < building.x + building.w + 24 && y > building.y - 24 && y < building.y + building.h + 24) return true;
        }
        return false;
    }

    function updatePrompt() {
        if (!state.started || state.panel || state.paused) {
            ui.interactionPrompt.classList.add('is-hidden');
            return;
        }
        if (!state.inVehicle && Math.hypot(state.player.x - state.car.x, state.player.y - state.car.y) < 76) {
            ui.interactionLabel.textContent = 'Monter dans le kart';
            ui.interactionPrompt.classList.remove('is-hidden');
            return;
        }
        const nearest = nearestBuilding();
        if (nearest.distance < 92) {
            ui.interactionLabel.textContent = `Entrer : ${nearest.building.name}`;
            ui.interactionPrompt.classList.remove('is-hidden');
            return;
        }
        ui.interactionPrompt.classList.add('is-hidden');
    }

    function interact() {
        if (!state.started || state.paused || state.panel) return;
        if (!state.inVehicle && Math.hypot(state.player.x - state.car.x, state.player.y - state.car.y) < 76) {
            state.inVehicle = true;
            state.player.x = state.car.x;
            state.player.y = state.car.y;
            showToast('Vous êtes au volant. Utilisez les flèches ou ZQSD pour traverser la ville.', 4);
            updatePrompt();
            return;
        }
        if (state.inVehicle && Math.hypot(state.player.x - state.car.x, state.player.y - state.car.y) < 100) {
            state.inVehicle = false;
            state.player.speed = 0;
            state.car.x = state.player.x;
            state.car.y = state.player.y;
            updatePrompt();
            return;
        }

        const nearest = nearestBuilding();
        if (nearest.distance > 92) return;
        const panelByBuilding = {
            hq: 'hq-panel',
            recruitment: 'recruitment-panel',
            bank: 'bank-panel',
            marketing: 'marketing-panel',
            service: 'service-panel'
        };
        openPanel(panelByBuilding[nearest.building.id]);
    }

    function drawRoads() {
        const roads = [
            [[0, 800], [330, 800], [520, 735], [760, 735], [900, 665], [1200, 665], [1470, 760], [1740, 790], [2100, 790]],
            [[390, 0], [390, 225], [550, 390], [760, 570], [980, 810], [980, 1120], [980, 1550]],
            [[1780, 0], [1780, 250], [1570, 420], [1340, 570], [1300, 780], [1470, 980], [1770, 1150]],
            [[0, 1170], [320, 1170], [570, 1060], [790, 910], [1065, 800]],
            [[530, 275], [780, 350], [1065, 570], [1335, 755], [1770, 1130]],
            [[1300, 250], [1200, 420], [1065, 570], [780, 755], [570, 1110]]
        ];
        context.lineCap = 'round';
        context.lineJoin = 'round';
        for (const points of roads) {
            context.beginPath();
            points.forEach(([x, y], index) => {
                if (index === 0) context.moveTo(x, y);
                else context.lineTo(x, y);
            });
            context.strokeStyle = '#596252';
            context.lineWidth = 82;
            context.stroke();
            context.strokeStyle = '#79806a';
            context.lineWidth = 3;
            context.setLineDash([20, 22]);
            context.stroke();
            context.setLineDash([]);
        }
    }

    function drawTerrain() {
        context.fillStyle = '#375d42';
        context.fillRect(0, 0, world.width, world.height);
        for (let row = 0; row < 20; row++) {
            for (let column = 0; column < 30; column++) {
                const seed = Math.sin((row + 1) * 17.1 + column * 43.7) * 0.5 + 0.5;
                context.fillStyle = seed > 0.7 ? 'rgba(158, 194, 103, 0.08)' : 'rgba(13, 39, 27, 0.06)';
                context.beginPath();
                context.ellipse(35 + column * 80, 30 + row * 80, 35, 18, seed * 2, 0, Math.PI * 2);
                context.fill();
            }
        }
        drawRoads();
        drawLandmarkTrees();
    }

    function drawLandmarkTrees() {
        const trees = [[170, 480], [220, 525], [570, 480], [570, 545], [1590, 500], [1650, 540], [1520, 980], [1590, 1030], [700, 1210], [750, 1260], [1920, 500], [1980, 550], [1130, 330], [1180, 320]];
        for (const [x, y] of trees) {
            context.fillStyle = '#634b35';
            context.fillRect(x - 5, y + 6, 10, 18);
            context.fillStyle = '#7eaa55';
            context.beginPath();
            context.arc(x, y, 21, 0, Math.PI * 2);
            context.fill();
            context.fillStyle = 'rgba(215, 245, 155, 0.27)';
            context.beginPath();
            context.arc(x - 7, y - 7, 8, 0, Math.PI * 2);
            context.fill();
        }
    }

    function drawBuilding(building) {
        context.save();
        context.shadowColor = 'rgba(0, 0, 0, 0.35)';
        context.shadowBlur = 22;
        context.shadowOffsetY = 10;
        context.fillStyle = '#18231d';
        context.fillRect(building.x - 9, building.y + 10, building.w + 18, building.h + 12);
        context.shadowColor = 'transparent';
        context.fillStyle = '#e7e1cb';
        context.fillRect(building.x, building.y + 22, building.w, building.h - 20);
        context.fillStyle = building.color;
        context.fillRect(building.x - 7, building.y, building.w + 14, 38);
        context.fillStyle = '#fff7dd';
        context.fillRect(building.x + 13, building.y + 48, building.w - 26, 7);
        context.fillStyle = '#27372b';
        context.fillRect(building.x + building.w / 2 - 24, building.y + building.h - 54, 48, 34);
        context.fillStyle = 'rgba(16, 25, 19, 0.78)';
        context.fillRect(building.x - 12, building.y - 47, building.w + 24, 39);
        context.fillStyle = building.accent;
        context.font = '800 17px "Barlow Condensed", sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(building.name, building.x + building.w / 2, building.y - 28, building.w + 10);
        context.fillStyle = '#f0eddf';
        context.font = '500 11px "DM Sans", sans-serif';
        context.fillText(building.subtitle, building.x + building.w / 2, building.y + building.h + 14, building.w + 60);
        context.restore();
    }

    function drawParkedKart() {
        context.save();
        context.translate(state.car.x, state.car.y);
        context.rotate(state.car.angle);
        context.fillStyle = '#18201c';
        context.fillRect(-28, -17, 56, 34);
        context.fillStyle = '#e64d3e';
        context.fillRect(-23, -19, 46, 38);
        context.fillStyle = '#f6c74e';
        context.fillRect(8, -13, 12, 26);
        context.fillStyle = '#242a26';
        context.fillRect(-13, -10, 19, 20);
        context.restore();
    }

    function drawPlayer() {
        const player = state.player;
        context.save();
        context.translate(player.x, player.y);
        context.rotate(state.inVehicle ? state.car.angle : player.angle);
        if (state.inVehicle) {
            context.fillStyle = '#191e1a';
            context.fillRect(-27, -16, 54, 32);
            context.fillStyle = '#e64d3e';
            context.fillRect(-23, -18, 46, 36);
            context.fillStyle = '#f4c448';
            context.fillRect(8, -12, 12, 24);
            context.fillStyle = '#25322a';
            context.fillRect(-12, -10, 20, 20);
            if (state.boostTimer > 0) {
                context.fillStyle = '#ffb13c';
                context.beginPath();
                context.moveTo(-22, -8);
                context.lineTo(-38 - Math.random() * 9, 0);
                context.lineTo(-22, 8);
                context.fill();
            }
        } else {
            context.fillStyle = 'rgba(10, 18, 12, 0.32)';
            context.beginPath();
            context.ellipse(0, 10, 14, 7, 0, 0, Math.PI * 2);
            context.fill();
            context.fillStyle = '#ef754f';
            context.beginPath();
            context.ellipse(0, 0, 11, 15, 0, 0, Math.PI * 2);
            context.fill();
            context.fillStyle = '#f5cf68';
            context.beginPath();
            context.arc(0, -12, 9, 0, Math.PI * 2);
            context.fill();
            context.fillStyle = '#3b3127';
            context.beginPath();
            context.arc(0, -14, 9, Math.PI, Math.PI * 2);
            context.fill();
            context.fillStyle = '#28342b';
            context.fillRect(-9, 7, 7, 11);
            context.fillRect(3, 7, 7, 11);
        }
        context.restore();
    }

    function drawWorld() {
        const bounds = canvas.getBoundingClientRect();
        const ratio = window.devicePixelRatio || 1;
        const width = bounds.width;
        const height = bounds.height;
        if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
            canvas.width = Math.round(width * ratio);
            canvas.height = Math.round(height * ratio);
        }
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.clearRect(0, 0, width, height);
        state.camera.x = clamp(state.player.x - width / 2, 0, world.width - width);
        state.camera.y = clamp(state.player.y - height / 2, 0, world.height - height);
        context.save();
        context.translate(-state.camera.x, -state.camera.y);
        drawTerrain();
        mapBuildings.forEach(drawBuilding);
        if (!state.inVehicle) drawParkedKart();
        drawPlayer();
        context.restore();
    }

    function scenePoint(mapX, mapY, elevation = 0) {
        return new THREE.Vector3(mapX - world.width / 2, elevation, mapY - world.height / 2);
    }

    function makeSurface(color, options = {}) {
        return new THREE.MeshStandardMaterial({ color, roughness: 0.88, ...options });
    }

    function makeStrip(curve, width, material, elevation, lateralOffset = 0) {
        const positions = [];
        const indices = [];
        const segments = Math.max(80, Math.ceil(curve.getLength() / 12));
        for (let index = 0; index <= segments; index++) {
            const t = index / segments;
            const center = curve.getPointAt(t);
            const tangent = curve.getTangentAt(t).normalize();
            const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
            center.addScaledVector(normal, lateralOffset);
            const left = center.clone().addScaledVector(normal, width / 2);
            const right = center.clone().addScaledVector(normal, -width / 2);
            positions.push(left.x, elevation, left.z, right.x, elevation, right.z);
            if (index < segments) {
                const vertex = index * 2;
                indices.push(vertex, vertex + 2, vertex + 1, vertex + 1, vertex + 2, vertex + 3);
            }
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        const mesh = new THREE.Mesh(geometry, material);
        mesh.receiveShadow = true;
        scene.add(mesh);
        return mesh;
    }

    function createCityRoads() {
        const definitions = [
            [[0, 800], [330, 800], [520, 735], [760, 735], [900, 665], [1200, 665], [1470, 760], [1740, 790], [2100, 790]],
            [[390, 0], [390, 225], [550, 390], [760, 570], [980, 810], [980, 1120], [980, 1550]],
            [[1780, 0], [1780, 250], [1570, 420], [1340, 570], [1300, 780], [1470, 980], [1770, 1150]],
            [[0, 1170], [320, 1170], [570, 1060], [790, 910], [1065, 800]],
            [[530, 275], [780, 350], [1065, 570], [1335, 755], [1770, 1130]],
            [[1300, 250], [1200, 420], [1065, 570], [780, 755], [570, 1110]],
            [[400, 275], [850, 275], [1300, 275], [1780, 275]]
        ];
        const roadMaterial = makeSurface('#444b48', { roughness: 0.96 });
        const pavementMaterial = makeSurface('#a5a99a', { roughness: 0.9 });
        const curbMaterial = makeSurface('#eee9d8', { roughness: 0.84 });
        roadPaths = definitions.map((definition) => {
            const points = definition.map(([x, y]) => scenePoint(x, y, 0.22));
            const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.45);
            makeStrip(curve, 82, roadMaterial, 0.2);
            makeStrip(curve, 15, pavementMaterial, 0.38, 49);
            makeStrip(curve, 15, pavementMaterial, 0.38, -49);
            makeStrip(curve, 2.2, curbMaterial, 0.56, 40.5);
            makeStrip(curve, 2.2, curbMaterial, 0.56, -40.5);
            addLaneDashes(curve);
            return curve;
        });
    }

    function addLaneDashes(curve) {
        const count = Math.max(6, Math.floor(curve.getLength() / 75));
        const geometry = new THREE.BoxGeometry(3.2, 0.18, 1.1);
        const material = makeSurface('#e1dfd3');
        for (let index = 0; index < count; index++) {
            const t = (index + 0.5) / count;
            const point = curve.getPointAt(t);
            const tangent = curve.getTangentAt(t);
            const dash = new THREE.Mesh(geometry, material);
            dash.position.set(point.x, 0.36, point.z);
            dash.rotation.y = Math.atan2(tangent.x, tangent.z);
            scene.add(dash);
        }
    }

    function createSignTexture(building) {
        const signCanvas = document.createElement('canvas');
        signCanvas.width = 640;
        signCanvas.height = 128;
        const signContext = signCanvas.getContext('2d');
        signContext.fillStyle = '#17231c';
        signContext.fillRect(0, 0, signCanvas.width, signCanvas.height);
        signContext.fillStyle = building.accent;
        signContext.fillRect(0, 0, 12, signCanvas.height);
        signContext.fillStyle = '#f5f1e4';
        signContext.font = '800 46px "Barlow Condensed", sans-serif';
        signContext.textAlign = 'center';
        signContext.textBaseline = 'middle';
        signContext.fillText(building.name, signCanvas.width / 2, 46, signCanvas.width - 30);
        signContext.fillStyle = '#c6cbb8';
        signContext.font = '500 20px "DM Sans", sans-serif';
        signContext.fillText(building.subtitle, signCanvas.width / 2, 96, signCanvas.width - 30);
        const texture = new THREE.CanvasTexture(signCanvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    function createBuilding3D(building, index) {
        const group = new THREE.Group();
        const position = scenePoint(building.x + building.w / 2, building.y + building.h / 2);
        const buildingHeight = 50 + index % 3 * 14;
        const shell = new THREE.Mesh(
            new THREE.BoxGeometry(building.w * 0.88, buildingHeight, building.h * 0.84),
            makeSurface(building.color, { roughness: 0.68 })
        );
        shell.position.y = buildingHeight / 2;
        shell.castShadow = true;
        shell.receiveShadow = true;
        group.add(shell);

        const roof = new THREE.Mesh(
            new THREE.BoxGeometry(building.w * 0.96, 8, building.h * 0.92),
            makeSurface(building.accent, { roughness: 0.52 })
        );
        roof.position.y = buildingHeight + 4;
        roof.castShadow = true;
        group.add(roof);

        const glassMaterial = makeSurface('#87c4b9', { metalness: 0.18, roughness: 0.26, emissive: '#203f39', emissiveIntensity: 0.28 });
        const columns = Math.max(3, Math.floor(building.w / 48));
        for (let column = 0; column < columns; column++) {
            const window = new THREE.Mesh(new THREE.BoxGeometry(22, 18, 2), glassMaterial);
            window.position.set(-building.w * 0.35 + column * (building.w * 0.7 / Math.max(1, columns - 1)), buildingHeight * 0.55, building.h * 0.42 + 1);
            group.add(window);
            const sideWindow = new THREE.Mesh(new THREE.BoxGeometry(2, 18, 20), glassMaterial);
            sideWindow.position.set(building.w * 0.44 + 1, buildingHeight * 0.55, -building.h * 0.28 + column * 22);
            group.add(sideWindow);
        }

        const entrance = new THREE.Mesh(new THREE.BoxGeometry(25, 31, 3), makeSurface('#34493c', { roughness: 0.46 }));
        entrance.position.set(0, 16, building.h * 0.43 + 2);
        group.add(entrance);

        const sign = new THREE.Sprite(new THREE.SpriteMaterial({ map: createSignTexture(building), transparent: true }));
        sign.position.set(0, buildingHeight + 32, building.h * 0.46);
        sign.scale.set(building.w * 0.9, 25, 1);
        group.add(sign);

        group.position.set(position.x, 0, position.z);
        group.userData.buildingId = building.id;
        scene.add(group);
        building.mesh = group;

        const boundary = new THREE.Mesh(
            new THREE.BoxGeometry(building.w + 52, 1, building.h + 50),
            new THREE.MeshBasicMaterial({ color: building.accent, transparent: true, opacity: 0.14, wireframe: true })
        );
        boundary.position.set(position.x, 1, position.z);
        scene.add(boundary);
    }

    function createHuman(color, scale = 1) {
        const person = new THREE.Group();
        const body = new THREE.Mesh(new THREE.CapsuleGeometry(4.1 * scale, 7 * scale, 4, 7), makeSurface(color, { roughness: 0.82 }));
        body.position.y = 12 * scale;
        body.castShadow = true;
        person.add(body);
        const head = new THREE.Mesh(new THREE.SphereGeometry(3.5 * scale, 12, 10), makeSurface('#e7bd8b', { roughness: 0.78 }));
        head.position.y = 21 * scale;
        head.castShadow = true;
        person.add(head);
        const hair = new THREE.Mesh(new THREE.SphereGeometry(3.6 * scale, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), makeSurface('#44392f'));
        hair.position.y = 22 * scale;
        person.add(hair);
        const legs = [];
        for (const side of [-1, 1]) {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(1.25 * scale, 1.6 * scale, 7 * scale, 7), makeSurface('#384d47'));
            leg.position.set(side * 2 * scale, 4 * scale, 0);
            leg.castShadow = true;
            person.add(leg);
            legs.push(leg);
        }
        person.userData.legs = legs;
        return person;
    }

    function createPedestrians() {
        const footpaths = [
            [[80, 780], [280, 765], [470, 735], [690, 720]],
            [[420, 110], [430, 280], [560, 410], [700, 540]],
            [[1710, 80], [1715, 240], [1510, 390], [1340, 545]],
            [[200, 1150], [385, 1145], [570, 1040], [760, 890]],
            [[610, 330], [800, 390], [1050, 550], [1290, 730]],
            [[1280, 330], [1195, 460], [1060, 590], [820, 730]]
        ];
        const outfits = ['#ed7650', '#75b6b0', '#d7bd61', '#a4c46d', '#b183c5', '#de9b6f'];
        for (let index = 0; index < 18; index++) {
            const definition = footpaths[index % footpaths.length];
            const path = new THREE.CatmullRomCurve3(definition.map(([x, y]) => scenePoint(x, y, 0.6)), false, 'centripetal', 0.42);
            const person = createHuman(outfits[index % outfits.length], 0.88 + index % 3 * 0.08);
            scene.add(person);
            pedestrians.push({ mesh: person, path, speed: 16 + index % 5 * 2.2, offset: index / 18, legs: person.userData.legs, direction: index % 2 ? 1 : -1 });
        }
    }

    function createCar3D(color, accent) {
        const car = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(26, 11, 46), makeSurface(color, { metalness: 0.12, roughness: 0.4 }));
        body.position.y = 9;
        body.castShadow = true;
        car.add(body);
        const hood = new THREE.Mesh(new THREE.BoxGeometry(21, 5, 13), makeSurface(accent, { roughness: 0.42 }));
        hood.position.set(0, 13, 15);
        car.add(hood);
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(19, 10, 19), makeSurface('#83b5ad', { metalness: 0.12, roughness: 0.24 }));
        cabin.position.set(0, 17, -2);
        car.add(cabin);
        const wheels = [];
        for (const side of [-1, 1]) {
            for (const forward of [-1, 1]) {
                const wheel = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 4, 12), makeSurface('#202421', { roughness: 0.96 }));
                wheel.rotation.z = Math.PI / 2;
                wheel.position.set(side * 14, 5, forward * 14);
                car.add(wheel);
                wheels.push(wheel);
            }
        }
        car.userData.wheels = wheels;
        return car;
    }

    function createTraffic() {
        const colors = ['#ec634b', '#57a7a2', '#e2c85b', '#d2d6c5', '#7fac58', '#b780bc', '#f29a55'];
        for (let index = 0; index < 12; index++) {
            const path = roadPaths[index % roadPaths.length];
            const vehicle = createCar3D(colors[index % colors.length], '#f4e8c5');
            scene.add(vehicle);
            trafficCars.push({ mesh: vehicle, path, speed: 42 + index % 4 * 9, offset: index / 12, direction: index % 2 ? 1 : -1, laneOffset: index % 2 ? 12 : -12, mapX: 0, mapY: 0 });
        }
    }

    function createPlayerModels() {
        playerMesh = createHuman('#ed7650', 1.14);
        scene.add(playerMesh);
        playerKartMesh = createCar3D('#e64d3e', '#f6c74e');
        scene.add(playerKartMesh);
        parkedKartMesh = playerKartMesh;
    }

    function create3DCity() {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        scene = new THREE.Scene();
        scene.background = new THREE.Color('#92ad9a');
        scene.fog = new THREE.Fog('#92ad9a', 520, 1900);
        camera = new THREE.PerspectiveCamera(43, 1, 0.1, 3000);
        scene.add(new THREE.HemisphereLight('#e7efd8', '#344d3a', 2.0));
        const sunlight = new THREE.DirectionalLight('#fff0ce', 3.0);
        sunlight.position.set(-380, 620, 460);
        sunlight.castShadow = true;
        sunlight.shadow.mapSize.set(2048, 2048);
        sunlight.shadow.camera.left = -1200;
        sunlight.shadow.camera.right = 1200;
        sunlight.shadow.camera.top = 1000;
        sunlight.shadow.camera.bottom = -1000;
        scene.add(sunlight);

        const ground = new THREE.Mesh(new THREE.PlaneGeometry(world.width, world.height), makeSurface('#577e53', { roughness: 1 }));
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -1;
        ground.receiveShadow = true;
        scene.add(ground);

        createCityRoads();
        mapBuildings.forEach(createBuilding3D);
        createTrees3D();
        createStreetFurniture();
        createPedestrians();
        createTraffic();
        createPlayerModels();
        resize3DCity();
        updateCityCamera(0.05);
    }

    function createTrees3D() {
        const treePositions = [[170, 480], [220, 525], [570, 480], [570, 545], [1590, 500], [1650, 540], [1520, 980], [1590, 1030], [700, 1210], [750, 1260], [1920, 500], [1980, 550], [1130, 330], [1180, 320], [720, 110], [840, 145], [1460, 1320], [1560, 1390], [630, 1320], [750, 1360]];
        const trunks = makeSurface('#70523a', { roughness: 1 });
        const leaves = [makeSurface('#478055', { roughness: 1 }), makeSurface('#5e8a56', { roughness: 1 }), makeSurface('#75955c', { roughness: 1 })];
        treePositions.forEach(([mapX, mapY], index) => {
            const tree = new THREE.Group();
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(4, 6, 24, 7), trunks);
            trunk.position.y = 12;
            tree.add(trunk);
            const crown = new THREE.Mesh(new THREE.ConeGeometry(18 + index % 3 * 2, 42, 8), leaves[index % leaves.length]);
            crown.position.y = 43;
            crown.castShadow = true;
            tree.add(crown);
            const point = scenePoint(mapX, mapY);
            tree.position.set(point.x, 0, point.z);
            scene.add(tree);
        });
    }

    function createStreetFurniture() {
        const lampMaterial = makeSurface('#34433b', { metalness: 0.3, roughness: 0.5 });
        const lampGlow = new THREE.MeshBasicMaterial({ color: '#f7e9a3' });
        const lampPositions = [[600, 710], [840, 705], [1450, 720], [1690, 780], [390, 500], [970, 1080], [1770, 930], [700, 1090]];
        for (const [mapX, mapY] of lampPositions) {
            const lamp = new THREE.Group();
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.2, 40, 8), lampMaterial);
            pole.position.y = 20;
            lamp.add(pole);
            const glow = new THREE.Mesh(new THREE.SphereGeometry(4, 8, 6), lampGlow);
            glow.position.y = 41;
            lamp.add(glow);
            const point = scenePoint(mapX, mapY);
            lamp.position.set(point.x, 0, point.z);
            scene.add(lamp);
        }
    }

    function resize3DCity() {
        if (!renderer || !camera) return;
        const bounds = canvas.getBoundingClientRect();
        renderer.setSize(bounds.width, bounds.height, false);
        camera.aspect = bounds.width / Math.max(bounds.height, 1);
        camera.updateProjectionMatrix();
    }

    function updateCityCamera(delta) {
        if (!camera) return;
        const playerPoint = scenePoint(state.player.x, state.player.y);
        const angle = state.inVehicle ? state.player.angle : state.player.angle;
        const distanceBehind = state.inVehicle ? 310 : 225;
        const height = state.inVehicle ? 250 : 230;
        const forwardX = Math.sin(angle);
        const forwardZ = -Math.cos(angle);
        const target = new THREE.Vector3(playerPoint.x, 16, playerPoint.z);
        const desired = new THREE.Vector3(
            playerPoint.x - forwardX * distanceBehind,
            height,
            playerPoint.z - forwardZ * distanceBehind
        );
        camera.position.lerp(desired, 1 - Math.exp(-2.8 * delta));
        camera.lookAt(target);
    }

    function animateTraffic(delta) {
        for (const traffic of trafficCars) {
            const pathLength = traffic.path.getLength();
            if (!pathLength) continue;
            const progress = ((state.time * traffic.speed + traffic.offset * pathLength * 2) % (pathLength * 2)) / pathLength;
            const reverse = progress > 1;
            const t = reverse ? 2 - progress : progress;
            const point = traffic.path.getPointAt(clamp(t, 0, 1));
            const tangent = traffic.path.getTangentAt(clamp(t, 0, 1));
            const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
            point.addScaledVector(normal, traffic.laneOffset);
            const direction = traffic.direction * (reverse ? -1 : 1);
            traffic.mesh.position.set(point.x, 1.5, point.z);
            traffic.mesh.rotation.y = Math.atan2(tangent.x * direction, tangent.z * direction);
            traffic.mapX = point.x + world.width / 2;
            traffic.mapY = point.z + world.height / 2;
            for (const wheel of traffic.mesh.userData.wheels) wheel.rotation.x += delta * traffic.speed * 0.12;
        }
    }

    function animatePedestrians() {
        for (const pedestrian of pedestrians) {
            const pathLength = pedestrian.path.getLength();
            const progress = ((state.time * pedestrian.speed + pedestrian.offset * pathLength * 2) % (pathLength * 2)) / pathLength;
            const reverse = progress > 1;
            const t = reverse ? 2 - progress : progress;
            const point = pedestrian.path.getPointAt(clamp(t, 0, 1));
            const tangent = pedestrian.path.getTangentAt(clamp(t, 0, 1));
            pedestrian.mesh.position.set(point.x, 0, point.z);
            pedestrian.mesh.rotation.y = Math.atan2(tangent.x, tangent.z) + (reverse ? Math.PI : 0);
            pedestrian.legs[0].rotation.x = Math.sin(state.time * 7 + pedestrian.offset * 12) * 0.42;
            pedestrian.legs[1].rotation.x = -pedestrian.legs[0].rotation.x;
        }
    }

    function updateInteraction() {
        if (!state.started || state.panel || state.paused) {
            ui.interactionPrompt.classList.add('is-hidden');
            return;
        }
        if (!state.inVehicle && Math.hypot(state.player.x - state.car.x, state.player.y - state.car.y) < 82) {
            ui.interactionLabel.textContent = 'Monter dans le kart';
            ui.interactionPrompt.classList.remove('is-hidden');
            return;
        }
        const nearest = nearestBuilding();
        if (nearest.distance < 95) {
            ui.interactionLabel.textContent = `Entrer : ${nearest.building.name}`;
            ui.interactionPrompt.classList.remove('is-hidden');
        } else {
            ui.interactionPrompt.classList.add('is-hidden');
        }
    }

    function updateDebrief() {
        const conversion = metrics.visitors ? Math.round(metrics.leads / metrics.visitors * 100) : 0;
        const retained = clamp(100 - metrics.churn, 0, 100);
        const profile = metrics.motivation < 45
            ? 'Manager sous tension : le rythme commercial dépasse les capacités de l’équipe.'
            : metrics.margin > 35 && metrics.revenue < metrics.revenueGoal
                ? 'Gardien de la marge : la valeur est protégée, mais l’acquisition doit accélérer.'
                : metrics.nps > 70
                    ? 'Bâtisseur de fidélité : la satisfaction soutient la croissance durable.'
                    : 'Pilote équilibré : continuez à arbitrer volume, capacité et rentabilité.';
        document.getElementById('manager-profile').textContent = `${profile} ${metrics.revenue >= metrics.revenueGoal ? 'Objectif annuel atteint.' : `Écart à l’objectif : ${formatMoney(metrics.revenueGoal - metrics.revenue)}.`}`;
        const rows = [
            ['CHIFFRE D’AFFAIRES', formatMoney(metrics.revenue)], ['OBJECTIF ANNUEL', formatMoney(metrics.revenueGoal)],
            ['MARGE MOYENNE', `${Math.round(metrics.margin)} %`], ['MOTIVATION', `${Math.round(metrics.motivation)} %`],
            ['NPS CLIENT', `${metrics.nps > 0 ? '+' : ''}${Math.round(metrics.nps)}`], ['TRÉSORERIE', formatMoney(state.cash)],
            ['PIPELINE ACTIF', `${metrics.pipeline} leads`], ['CONVERSION LEAD', `${conversion} %`],
            ['RÉTENTION', `${retained} %`], ['LEADS PERDUS', String(state.lostLeads)], ['ÉQUIPE', `${team.length} personnes`]
        ];
        ui.debriefReport.replaceChildren();
        for (const [label, value] of rows) {
            const item = document.createElement('div');
            item.className = 'debrief-kpi';
            const heading = document.createElement('span');
            heading.textContent = label;
            const result = document.createElement('strong');
            result.textContent = value;
            item.append(heading, result);
            ui.debriefReport.appendChild(item);
        }
        ui.funnelSummary.textContent = `Notoriété : ${metrics.visitors.toLocaleString('fr-FR')} visiteurs · Intérêt : ${metrics.leads} leads · Considération : ${metrics.qualified} leads qualifiés / ${metrics.meetings} RDV · Décision : ${metrics.sales} ventes · Fidélisation : ${retained} % de rétention.`;
        ui.decisionLog.replaceChildren();
        state.log.slice(-8).reverse().forEach((entry) => {
            const row = document.createElement('p');
            row.textContent = entry;
            ui.decisionLog.appendChild(row);
        });
    }

    function completeAction(message) {
        updateHud();
        updateDashboard();
        if (message) showToast(message);
    }

    function performPhaseAction() {
        const marketing = Number(ui.marketingAllocation.value);
        switch (state.selectedPhase) {
            case 'awareness': {
                if (!spend(marketing, 'campagne de notoriété')) return;
                const visitors = Math.round(marketing / 10 + 300);
                metrics.visitors += visitors;
                metrics.impressions += visitors * 12;
                phaseResults.awareness.actionCount++;
                phaseResults.awareness.visitors = metrics.visitors;
                showToast(`Campagne lancée : +${visitors} visiteurs. Le coût par visiteur est ${formatMoney(marketing / Math.max(1, visitors))}.`);
                break;
            }
            case 'interest': {
                if (!spend(2500, 'contenu de conversion')) return;
                const visitors = Math.max(120, Math.round(metrics.visitors * 0.12));
                const leads = Math.round(visitors * 0.035);
                metrics.visitors += visitors;
                metrics.leads += leads;
                metrics.pipeline += leads;
                state.newLeadsThisPeriod += leads;
                phaseResults.interest.actionCount++;
                phaseResults.interest.leads += leads;
                phaseResults.interest.cost += 2500;
                showToast(`${leads} nouveaux leads ajoutés au pipeline. Mesurez le CPL et la conversion visiteur → lead.`);
                break;
            }
            case 'consideration': {
                const capacity = team.filter((employee) => employee.role === 'SDR').length * 8 + state.tempCapacity;
                const qualified = Math.min(metrics.pipeline, capacity);
                metrics.pipeline -= qualified;
                metrics.qualifiedPipeline += qualified;
                metrics.qualified += qualified;
                phaseResults.consideration.actionCount++;
                phaseResults.consideration.qualified += qualified;
                showToast(`${qualified} leads qualifiés. Capacité actuelle : ${capacity} leads par période.`);
                break;
            }
            case 'decision': {
                const capacity = team.filter((employee) => employee.role === 'AE').length * 4;
                const meetings = Math.min(metrics.qualifiedPipeline, capacity);
                const signed = Math.floor(meetings * 0.3);
                metrics.qualifiedPipeline -= meetings;
                metrics.meetings += meetings;
                metrics.sales += signed;
                metrics.revenue += signed * metrics.averageTicket;
                metrics.cash = state.cash;
                phaseResults.decision.actionCount++;
                phaseResults.decision.sales += signed;
                phaseResults.decision.cycleDays = Math.max(12, phaseResults.decision.cycleDays - 2);
                showToast(`${meetings} rendez-vous traités, ${signed} vente${signed > 1 ? 's' : ''} signée${signed > 1 ? 's' : ''}.`);
                break;
            }
            case 'loyalty': {
                const csCapacity = team.filter((employee) => employee.role === 'CS').length * 10;
                if (csCapacity === 0) {
                    metrics.nps = clamp(metrics.nps - 3, -100, 100);
                    metrics.churn = Math.min(55, metrics.churn + 3);
                    showToast('Aucun Customer Success : le churn augmente. Recrutez ou réallouez la capacité.', 5);
                } else {
                    metrics.nps = clamp(metrics.nps + Math.min(8, csCapacity), -100, 100);
                    metrics.churn = Math.max(0, metrics.churn - 3);
                    metrics.revenue += 5000;
                    metrics.margin = clamp(metrics.margin + 1, 5, 65);
                    phaseResults.loyalty.retained += csCapacity;
                    showToast('Suivi client effectué : NPS et rétention progressent, churn en baisse.');
                }
                phaseResults.loyalty.actionCount++;
                break;
            }
        }
        metrics.nps = clamp(metrics.nps, -100, 100);
        maybeTriggerStoryMission();
        completeAction();
    }

    function spend(amount, label) {
        if (state.cash < amount) {
            showToast(`Trésorerie insuffisante pour ${label}. Rendez-vous à la banque ou réduisez l'allocation.`, 5);
            return false;
        }
        state.cash -= amount;
        state.spent += amount;
        return true;
    }

    function closePeriod() {
        const inbound = metrics.pipeline;
        const sdrCapacity = team.filter((employee) => employee.role === 'SDR').length * 8 + state.tempCapacity;
        const aeCapacity = team.filter((employee) => employee.role === 'AE').length * 4;
        const payroll = team.reduce((sum, employee) => sum + employee.salary, 0);
        const paid = Math.min(state.cash, payroll);
        state.cash -= paid;

        const capacity = Math.max(1, sdrCapacity);
        const overload = Math.max(0, inbound - capacity * 1.2);
        if (overload > 0) {
            state.burnoutPeriods++;
            const lost = Math.max(0, Math.floor(overload * 0.45));
            state.lostLeads += lost;
            metrics.pipeline = Math.max(0, metrics.pipeline - lost);
            metrics.motivation = clamp(metrics.motivation - Math.min(14, 4 + overload * 0.38), 0, 100);
            metrics.nps = clamp(metrics.nps - Math.min(8, lost * 0.8), -100, 100);
            team.forEach((employee) => { employee.fatigue = clamp(employee.fatigue + 12, 0, 100); });
        } else {
            state.burnoutPeriods = Math.max(0, state.burnoutPeriods - 1);
            metrics.motivation = clamp(metrics.motivation + 2, 0, 100);
            team.forEach((employee) => { employee.fatigue = Math.max(0, employee.fatigue - 8); });
        }

        const qualified = Math.min(metrics.pipeline, sdrCapacity);
        metrics.pipeline -= qualified;
        metrics.qualifiedPipeline += qualified;
        metrics.qualified += qualified;
        const meetings = Math.min(metrics.qualifiedPipeline, aeCapacity);
        metrics.qualifiedPipeline -= meetings;
        metrics.meetings += meetings;
        const signed = Math.floor(meetings * clamp(0.22 + metrics.margin / 250, 0.25, 0.48));
        metrics.sales += signed;
        metrics.revenue += signed * metrics.averageTicket;
        metrics.cash = state.cash;

        const csCount = team.filter((employee) => employee.role === 'CS').length;
        if (csCount === 0) {
            metrics.churn = Math.min(60, metrics.churn + 2);
            metrics.retention = clamp(100 - metrics.churn, 0, 100);
            metrics.nps = clamp(metrics.nps - 2, -100, 100);
            const revenueLost = Math.round(metrics.revenue * 0.012);
            metrics.revenue = Math.max(0, metrics.revenue - revenueLost);
            metrics.cpa += revenueLost ? Math.round(paid / Math.max(1, signed)) : 0;
        }

        const underfunded = paid < payroll;
        if (underfunded) showToast('Trésorerie sous tension : certains coûts de période n’ont pas pu être couverts.', 5);
        if (overload > 0) showToast(`${Math.floor(overload)} leads dépassent la capacité : motivation ${Math.round(metrics.motivation)} %, NPS ${Math.round(metrics.nps)}.`, 5);

        if (metrics.motivation <= 18 && state.burnoutPeriods >= 2 && !state.attritionTriggered) {
            const aeIndex = team.findIndex((employee) => employee.role === 'AE');
            if (aeIndex >= 0) {
                team.splice(aeIndex, 1);
                state.attritionTriggered = true;
                showToast('Démission : votre Account Executive quitte l’équipe. Le closing est bloqué jusqu’au recrutement.', 7);
            }
        }

        state.tempPeriods--;
        if (state.tempPeriods <= 0) state.tempCapacity = 0;
        state.period++;
        if (state.period > 4) { state.period = 1; state.year++; }
        maybeTriggerStoryMission();
        updateDashboard();
        if (Math.random() < 0.38) openRandomEvent();
        else showToast(`Période clôturée : ${qualified} leads qualifiés, ${meetings} RDV, ${signed} ventes.`, 5);
    }

    function maybeTriggerStoryMission() {
        if (!state.storyRecruitment && team.length <= 2 && (state.burnoutPeriods > 0 || metrics.pipeline > 14)) {
            state.storyRecruitment = true;
            showToast('MISSION HISTOIRE : le pipeline dépasse la capacité de l’équipe. Rendez-vous à l’agence et recrutez un renfort.', 7);
        }
    }

    function openRandomEvent() {
        const event = eventLibrary[Math.floor(Math.random() * eventLibrary.length)];
        openEvent(event, 'ÉVÉNEMENT STRATÉGIQUE');
    }

    function openEvent(event, type) {
        closePanels();
        state.panel = 'event-panel';
        ui.eventType.textContent = type;
        ui.eventTitle.textContent = event.title;
        ui.eventContext.textContent = event.context;
        ui.eventChoices.replaceChildren();
        ui.eventFeedback.classList.add('is-hidden');
        event.choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.className = 'event-choice';
            button.type = 'button';
            button.innerHTML = `<span class="event-choice-letter">${String.fromCharCode(65 + index)}</span><span><strong>${choice.title}</strong><small>${choice.note}</small></span>`;
            button.addEventListener('click', () => resolveEvent(choice, button));
            ui.eventChoices.appendChild(button);
        });
        ui.eventPanel.classList.remove('is-hidden');
        ui.panelBackdrop.classList.remove('is-hidden');
        state.event = event;
    }

    function resolveEvent(choice, selected) {
        applyEffects(choice.effects || {});
        state.decisionCount++;
        document.querySelectorAll('.event-choice').forEach((button) => { button.disabled = true; });
        selected.classList.add('is-selected');
        ui.eventFeedback.textContent = choice.feedback;
        ui.eventFeedback.classList.remove('is-hidden');
        state.log.unshift(`${state.periodLabelText || `P${state.period}`} · ${choice.title}`);
        const continueButton = document.createElement('button');
        continueButton.className = 'secondary-action event-continue';
        continueButton.type = 'button';
        continueButton.textContent = 'REPRENDRE LA GESTION';
        continueButton.addEventListener('click', () => {
            closePanels();
            state.event = null;
            updateDashboard();
        });
        ui.eventFeedback.appendChild(continueButton);
        updateHud();
    }

    function applyEffects(effects) {
        for (const [key, amount] of Object.entries(effects)) {
            if (key === 'cash') state.cash = Math.max(0, state.cash + amount);
            else if (key === 'temp') { state.tempCapacity += amount; state.tempPeriods = 2; }
            else if (key === 'lostLeads') { state.lostLeads += amount; metrics.pipeline = Math.max(0, metrics.pipeline - amount); }
            else if (key === 'leads') { metrics.leads += amount; metrics.pipeline += amount; state.newLeadsThisPeriod += amount; }
            else if (key === 'retention') metrics.churn = clamp(metrics.churn - amount, 0, 100);
            else if (key in metrics) metrics[key] += amount;
        }
        metrics.margin = clamp(metrics.margin, 5, 65);
        metrics.motivation = clamp(metrics.motivation, 0, 100);
        metrics.nps = clamp(metrics.nps, -100, 100);
        metrics.revenue = Math.max(0, metrics.revenue);
        metrics.pipeline = Math.max(0, metrics.pipeline);
        metrics.sales = Math.max(0, metrics.sales);
        metrics.retention = clamp(100 - metrics.churn, 0, 100);
        metrics.cash = state.cash;
        updateHud();
        updateDashboard();
    }

    function hire(role) {
        const offers = {
            SDR: { name: 'SDR', fee: 8000, salary: 5500 },
            AE: { name: 'AE', fee: 10000, salary: 7000 },
            CS: { name: 'CS', fee: 7000, salary: 5000 },
            TEMP: { name: 'INTÉRIM', fee: 4000, salary: 0 }
        };
        const offer = offers[role];
        if (!offer || state.cash < offer.fee) {
            showToast('Trésorerie insuffisante. La banque peut financer ce recrutement.', 5);
            return;
        }
        state.cash -= offer.fee;
        if (role === 'TEMP') {
            state.tempCapacity += 8;
            state.tempPeriods = 2;
        } else {
            const names = { SDR: 'Lina M.', AE: 'Eliott V.', CS: 'Sara K.' };
            team.push({ name: names[role], role, core: false, salary: offer.salary, fatigue: 0 });
        }
        if (state.storyRecruitment) state.storyHired = true;
        state.log.unshift(`Recrutement : ${offer.name} rejoint l'équipe.`);
        updateDashboard();
        showToast(`${offer.name} recruté. La capacité de l'équipe augmente.`, 5);
    }

    function launchCampaign(campaignId) {
        const campaign = campaigns[campaignId];
        if (!campaign || !spend(campaign.cost, campaign.label)) return;
        metrics.visitors += campaign.visitors;
        metrics.impressions += campaign.visitors * 10;
        metrics.leads += campaign.leads;
        metrics.pipeline += campaign.leads;
        state.newLeadsThisPeriod += campaign.leads;
        metrics.qualified += campaign.qualified;
        metrics.margin = clamp(metrics.margin + (campaign.margin || 0), 5, 65);
        metrics.nps = clamp(metrics.nps + (campaign.nps || 0), -100, 100);
        state.campaignCount++;
        state.log.unshift(`Campagne ${campaign.label} : +${campaign.leads} leads.`);
        updateDashboard();
        showToast(`${campaign.label} : ${campaign.visitors} visiteurs et ${campaign.leads} leads générés.`, 5);
        maybeTriggerStoryMission();
    }

    function addLoan(amount) {
        const fee = amount === 25000 ? 1500 : 3500;
        state.cash += amount - fee;
        state.debt += amount + fee;
        state.log.unshift(`Financement : crédit de ${formatMoney(amount)}, frais ${formatMoney(fee)}.`);
        updateDashboard();
        showToast(`Crédit obtenu : ${formatMoney(amount - fee)} ajoutés à la trésorerie. Les frais pèsent sur la marge future.`);
    }

    function phaseAction() {
        const budget = Number(ui.marketingAllocation.value);
        switch (state.selectedPhase) {
            case 'awareness':
                if (!spend(budget, 'campagne de notoriété')) return;
                const visitors = Math.round(budget / 10 + 300);
                metrics.visitors += visitors;
                metrics.impressions += visitors * 12;
                phaseResults.awareness.actionCount++;
                showToast(`Campagne lancée : +${visitors} visiteurs. Coût / visiteur : ${formatMoney(budget / visitors)}.`);
                break;
            case 'interest': {
                if (!spend(2500, 'contenu de conversion')) return;
                const newLeads = Math.max(3, Math.round(metrics.visitors * 0.006));
                metrics.leads += newLeads;
                metrics.pipeline += newLeads;
                state.newLeadsThisPeriod += newLeads;
                phaseResults.interest.actionCount++;
                showToast(`${newLeads} leads ajoutés. CPL cumulé : ${formatMoney((state.spent || 0) / Math.max(1, metrics.leads))}.`);
                break;
            }
            case 'consideration': {
                const capacity = team.filter((employee) => employee.role === 'SDR').length * 8 + state.tempCapacity;
                const qualified = Math.min(metrics.pipeline, capacity);
                metrics.pipeline -= qualified;
                metrics.qualifiedPipeline += qualified;
                metrics.qualified += qualified;
                phaseResults.consideration.actionCount++;
                showToast(`${qualified} leads qualifiés avec une capacité de ${capacity} par période.`);
                break;
            }
            case 'decision': {
                const capacity = team.filter((employee) => employee.role === 'AE').length * 4;
                if (capacity === 0) { showToast('Aucun Account Executive disponible : le closing est bloqué. Rendez-vous à l’agence de recrutement.', 6); return; }
                const meetings = Math.min(metrics.qualifiedPipeline, capacity);
                const signed = Math.floor(meetings * 0.32);
                metrics.qualifiedPipeline -= meetings;
                metrics.meetings += meetings;
                metrics.sales += signed;
                metrics.revenue += signed * metrics.averageTicket;
                phaseResults.decision.actionCount++;
                showToast(`${meetings} rendez-vous traités · ${signed} ventes signées · panier moyen ${formatMoney(metrics.averageTicket)}.`);
                break;
            }
            case 'loyalty': {
                const cs = team.filter((employee) => employee.role === 'CS').length;
                if (cs === 0) {
                    metrics.churn = Math.min(60, metrics.churn + 3);
                    metrics.nps = clamp(metrics.nps - 3, -100, 100);
                    const lostRevenue = Math.round(metrics.revenue * 0.015);
                    metrics.revenue = Math.max(0, metrics.revenue - lostRevenue);
                    metrics.cpa += lostRevenue ? Math.round(budget / lostRevenue) : 0;
                    showToast(`Sans Customer Success, ${formatMoney(lostRevenue)} de valeur client s'érode. Le churn fait remonter le CPA.`, 6);
                } else {
                    metrics.churn = Math.max(0, metrics.churn - 3);
                    metrics.nps = clamp(metrics.nps + 7, -100, 100);
                    metrics.retention = clamp(metrics.retention + 4, 0, 100);
                    metrics.revenue += 4000 * cs;
                    showToast('Plan de suivi exécuté : rétention et NPS progressent, churn en baisse.');
                }
                phaseResults.loyalty.actionCount++;
                break;
            }
        }
        updateDashboard();
        maybeTriggerStoryMission();
    }

    function togglePause() {
        state.paused = !state.paused;
        ui.pausePanel.classList.toggle('is-hidden', !state.paused);
        if (state.paused) keys.clear();
    }

    function setPhase(phaseId) {
        const phase = phases.find((entry) => entry.id === phaseId);
        if (!phase) return;
        const phaseIndex = phases.indexOf(phase);
        if (phaseIndex > state.currentPhaseIndex) {
            showToast('Validez d’abord l’étape en cours pour débloquer la suivante.');
            return;
        }
        state.selectedPhase = phaseId;
        document.querySelectorAll('.funnel-tab').forEach((button) => button.classList.toggle('is-active', button.dataset.phase === phaseId));
        document.getElementById('phase-kicker').textContent = phase.kicker;
        document.getElementById('phase-title').textContent = phase.name;
        document.getElementById('phase-objective').textContent = phase.objective;
        document.getElementById('phase-activities').textContent = phase.activities;
        document.getElementById('phase-kpis').textContent = phase.kpis;
        document.getElementById('phase-action').textContent = phase.action;
        updatePhaseView();
    }

    function validatePhase() {
        const index = state.currentPhaseIndex;
        const goal = phaseGoals[index];
        if (!goal || phases[index].id !== state.selectedPhase) return;
        if (!goal.reached()) {
            showToast(`Objectif non atteint : ${goal.target}. La phase suivante reste verrouillée.`, 5);
            updatePhaseView();
            return;
        }

        state.validatedPhases[index] = true;
        state.log.unshift(`Année ${state.year} · ${phases[index].name} validée.`);
        if (index < phases.length - 1) {
            state.currentPhaseIndex++;
            setPhase(phases[state.currentPhaseIndex].id);
            showToast(`${phases[index].name} validée. La phase ${phases[state.currentPhaseIndex].name} est débloquée.`, 5);
            return;
        }

        state.currentPhaseIndex = 0;
        setPhase(phases[0].id);
        closePeriod();
        showToast('Les cinq phases sont validées. Nouvelle période : le funnel repart.', 5);
    }

    function performRecruitmentMission() {
        if (state.storyRecruitment && !state.storyHired) {
            if (team.length > 2) state.storyHired = true;
        }
        updateStory();
    }

    function openBuilding(building) {
        if (building.id === 'hq') openPanel('hq-panel');
        else if (building.id === 'recruitment') openPanel('recruitment-panel');
        else if (building.id === 'bank') openPanel('bank-panel');
        else if (building.id === 'marketing') openPanel('marketing-panel');
        else if (building.id === 'service') openPanel('service-panel');
    }

    function handleInteract() {
        if (!state.started || state.paused || state.panel) return;
        const player = state.player;
        if (!state.inVehicle && Math.hypot(player.x - state.car.x, player.y - state.car.y) < 82) {
            state.inVehicle = true;
            player.x = state.car.x;
            player.y = state.car.y;
            showToast('Kart démarré. Les routes relient les cinq pôles de la ville.');
            return;
        }
        if (state.inVehicle && Math.hypot(player.x - state.car.x, player.y - state.car.y) < 130) {
            state.inVehicle = false;
            state.car.x = player.x;
            state.car.y = player.y;
            player.speed = 0;
            return;
        }
        const nearest = nearestBuilding();
        if (nearest.distance <= 95) openBuilding(nearest.building);
    }

    function startPhase() {
        const phase = state.selectedPhase;
        switch (phase) {
            case 'awareness': {
                const budget = Number(ui.marketingAllocation.value);
                if (state.cash < budget) return showToast('Trésorerie insuffisante : financez la campagne à la banque.', 5);
                state.cash -= budget;
                const visitors = Math.round(budget / 10 + 300);
                metrics.visitors += visitors;
                metrics.impressions += visitors * 12;
                phaseResults.awareness.actionCount++;
                showToast(`Campagne : +${visitors} visiteurs pour ${formatMoney(budget)}.`);
                break;
            }
            case 'interest': {
                if (!spend(2500, 'contenu')) return;
                const leads = Math.max(3, Math.round(metrics.visitors * 0.006));
                metrics.leads += leads;
                metrics.pipeline += leads;
                state.newLeadsThisPeriod += leads;
                phaseResults.interest.actionCount++;
                showToast(`Contenu publié : ${leads} leads générés.`);
                break;
            }
            case 'consideration': {
                const capacity = team.filter((employee) => employee.role === 'SDR').length * 8 + state.tempCapacity;
                const qualified = Math.min(metrics.pipeline, capacity);
                metrics.pipeline -= qualified;
                metrics.qualifiedPipeline += qualified;
                metrics.qualified += qualified;
                phaseResults.consideration.actionCount++;
                showToast(`${qualified} leads qualifiés. Il reste ${metrics.pipeline} leads à traiter.`);
                break;
            }
            case 'decision': {
                const capacity = team.filter((employee) => employee.role === 'AE').length * 4;
                if (!capacity) return showToast('Le closing est bloqué : recrutez un Account Executive.', 5);
                const meetings = Math.min(metrics.qualifiedPipeline, capacity);
                const sales = Math.floor(meetings * 0.3);
                metrics.qualifiedPipeline -= meetings;
                metrics.meetings += meetings;
                metrics.sales += sales;
                metrics.revenue += sales * metrics.averageTicket;
                phaseResults.decision.actionCount++;
                showToast(`${meetings} RDV traités, ${sales} ventes signées.`);
                break;
            }
            case 'loyalty': {
                if (!team.some((employee) => employee.role === 'CS')) {
                    metrics.churn = Math.min(60, metrics.churn + 3);
                    metrics.nps -= 3;
                    const lostRevenue = Math.round(metrics.revenue * 0.015);
                    metrics.revenue = Math.max(0, metrics.revenue - lostRevenue);
                    showToast(`Sans suivi client, ${formatMoney(lostRevenue)} de valeur s'érode et le churn remonte.`, 5);
                } else {
                    metrics.churn = Math.max(0, metrics.churn - 3);
                    metrics.nps = clamp(metrics.nps + 7, -100, 100);
                    metrics.revenue += 4000;
                    showToast('Onboarding et suivi réalisés : NPS en hausse, churn en baisse.');
                }
                phaseResults.loyalty.actionCount++;
                break;
            }
        }
        updateDashboard();
        maybeTriggerStoryMission();
    }

    function renderDashboard() {
        updateDashboard();
        setPhase(state.selectedPhase);
    }

    function renderMenu() {
        ui.startScreen.classList.remove('is-hidden');
        ui.cityKpis.classList.add('is-hidden');
        state.started = false;
        closePanels();
    }

    function keyboardMove(delta) {
        const player = state.player;
        const left = keys.has('ArrowLeft') || keys.has('KeyQ') || keys.has('KeyA');
        const right = keys.has('ArrowRight') || keys.has('KeyD');
        const up = keys.has('ArrowUp') || keys.has('KeyZ') || keys.has('KeyW');
        const down = keys.has('ArrowDown') || keys.has('KeyS');
        if (state.inVehicle) {
            const steer = Number(right) - Number(left);
            if (up) player.speed = Math.min(320, player.speed + 420 * delta);
            else player.speed = Math.max(0, player.speed - 150 * delta);
            if (down) player.speed = Math.max(-120, player.speed - 470 * delta);
            player.angle += steer * (0.8 + Math.abs(player.speed) / 160) * delta;
            const nextX = player.x + Math.sin(player.angle) * player.speed * delta;
            const nextY = player.y - Math.cos(player.angle) * player.speed * delta;
            if (!canCollide(nextX, player.y)) player.x = clamp(nextX, 35, world.width - 35);
            else player.speed *= 0.35;
            if (!canCollide(player.x, nextY)) player.y = clamp(nextY, 35, world.height - 35);
            else player.speed *= 0.35;
            const sceneX = player.x - world.width / 2;
            const sceneZ = player.y - world.height / 2;
            const trafficHit = trafficCars.some((traffic) => Math.hypot(sceneX - traffic.mapX, sceneZ - traffic.mapY) < 30);
            if (trafficHit) {
                player.speed *= 0.52;
                metrics.motivation = clamp(metrics.motivation - 0.3, 0, 100);
            }
            state.car.x = player.x;
            state.car.y = player.y;
            state.car.angle = player.angle;
            state.driveDistance += Math.abs(player.speed * delta);
            metrics.visitors += state.boostTimer > 0 ? delta * 2 : 0;
            state.boostTimer = Math.max(0, state.boostTimer - delta);
            return;
        }
        const dx = Number(right) - Number(left);
        const dy = Number(down) - Number(up);
        if (!dx && !dy) return;
        const length = Math.hypot(dx, dy) || 1;
        const speed = 185;
        const nextX = player.x + dx / length * speed * delta;
        const nextY = player.y + dy / length * speed * delta;
        if (!canCollide(nextX, player.y)) player.x = clamp(nextX, 25, world.width - 25);
        if (!canCollide(player.x, nextY)) player.y = clamp(nextY, 25, world.height - 25);
        player.angle = Math.atan2(dx, -dy);
        state.playerFootstep += delta;
    }

    function update(delta) {
        state.time += delta;
        if (state.started && !state.panel && !state.paused) {
            keyboardMove(delta);
            updateInteraction();
            for (const employee of team) employee.fatigue = clamp(employee.fatigue + delta * (state.inVehicle ? 0 : 0.04), 0, 100);
        }
        if (state.toastTimer > 0) {
            state.toastTimer -= delta;
            if (state.toastTimer <= 0) ui.toast.classList.remove('toast-visible');
        }
        animateTraffic(delta);
        animatePedestrians();
        syncPlayer3D();
        updateCityCamera(delta);
    }

    function syncPlayer3D() {
        if (!playerMesh || !playerKartMesh) return;
        const point = scenePoint(state.player.x, state.player.y, 0);
        playerMesh.position.set(point.x, 0, point.z);
        playerMesh.rotation.y = state.player.angle + Math.PI;
        playerMesh.visible = !state.inVehicle;
        playerKartMesh.position.set(point.x, 1.5, point.z);
        playerKartMesh.rotation.y = state.player.angle + Math.PI;
        playerKartMesh.visible = state.inVehicle;
        if (parkedKartMesh) {
            const parkedPoint = scenePoint(state.car.x, state.car.y, 0);
            parkedKartMesh.position.set(parkedPoint.x, 1.5, parkedPoint.z);
            parkedKartMesh.rotation.y = state.car.angle + Math.PI;
            parkedKartMesh.visible = !state.inVehicle;
        }
        if (state.inVehicle) {
            for (const wheel of playerKartMesh.userData.wheels) wheel.rotation.x += Math.abs(state.player.speed) * 0.001;
        } else if (Math.abs(state.playerFootstep) > 0) {
            playerMesh.userData.legs[0].rotation.x = Math.sin(state.time * 7) * 0.32;
            playerMesh.userData.legs[1].rotation.x = -playerMesh.userData.legs[0].rotation.x;
        }
    }

    function draw() {
        if (renderer && scene && camera) renderer.render(scene, camera);
    }

    function frame(timestamp) {
        const delta = state.lastFrame ? Math.min((timestamp - state.lastFrame) / 1000, 0.05) : 0;
        state.lastFrame = timestamp;
        update(delta);
        draw();
        requestAnimationFrame(frame);
    }

    function bindControls() {
        window.addEventListener('keydown', (event) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault();
            if (event.code === 'Escape') {
                if (state.panel) closePanels();
                else togglePause();
                return;
            }
            if (event.code === 'KeyE' || (event.code === 'Space' && state.started)) {
                event.preventDefault();
                if (!event.repeat) handleInteract();
                return;
            }
            if (event.code === 'Enter' && !state.started) startStory();
            if (!state.panel && !state.paused) keys.add(event.code);
        });
        window.addEventListener('keyup', (event) => keys.delete(event.code));
        window.addEventListener('blur', () => keys.clear());
        window.addEventListener('resize', resize3DCity);
        ui.startButton.addEventListener('click', startStory);
        document.getElementById('pause-open').addEventListener('click', togglePause);
        document.getElementById('resume-game').addEventListener('click', togglePause);
        document.getElementById('debrief-open').addEventListener('click', () => openPanel('debrief-panel'));
        document.getElementById('staffing-shortcut').addEventListener('click', () => openPanel('recruitment-panel'));
        document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', closePanels));
        ui.panelBackdrop.addEventListener('click', closePanels);
        document.querySelectorAll('.funnel-tab').forEach((button) => button.addEventListener('click', () => setPhase(button.dataset.phase)));
        ui.phaseAction.addEventListener('click', phaseAction);
        ui.validatePhase.addEventListener('click', validatePhase);
        document.getElementById('marketing-allocation').addEventListener('input', (event) => {
            state.marketingBudget = Number(event.target.value);
            document.getElementById('marketing-allocation-value').textContent = state.marketingBudget.toLocaleString('fr-FR');
        });
        document.getElementById('coaching-allocation').addEventListener('input', (event) => {
            state.coachingDays = Number(event.target.value);
            document.getElementById('coaching-allocation-value').textContent = String(state.coachingDays);
        });
        document.querySelectorAll('[data-hire]').forEach((button) => button.addEventListener('click', () => hire(button.dataset.hire)));
        document.querySelectorAll('[data-loan]').forEach((button) => button.addEventListener('click', () => addLoan(Number(button.dataset.loan))));
        document.querySelectorAll('[data-campaign]').forEach((button) => button.addEventListener('click', () => launchCampaign(button.dataset.campaign)));
        document.querySelectorAll('[data-service-action]').forEach((button) => button.addEventListener('click', () => resolveServiceAction(button.dataset.serviceAction)));
    }

    function resolveServiceAction(action) {
        if (action === 'followup') {
            metrics.nps = clamp(metrics.nps + 8, -100, 100);
            metrics.churn = Math.max(0, metrics.churn - 3);
            metrics.revenue += 3000;
            showToast('Suivi client : NPS en hausse et churn en baisse.');
        } else {
            metrics.nps = clamp(metrics.nps + 13, -100, 100);
            metrics.churn = Math.max(0, metrics.churn - 5);
            state.cash -= 1500;
            metrics.margin = clamp(metrics.margin - 1, 5, 65);
            showToast('Réclamation traitée. Le geste commercial coûte 1 500 € de marge immédiate.');
        }
        updateDashboard();
    }

    function startStory() {
        if (state.started) return;
        state.started = true;
        ui.startScreen.classList.add('is-hidden');
        ui.cityKpis.classList.remove('is-hidden');
        showToast('Vous commencez à pied. Appuyez sur E près d’un bâtiment, ou rejoignez le kart pour conduire.', 6);
        updateHud();
    }

    function initialize() {
        if (!canvas || !THREE) {
            document.getElementById('desktop-warning').innerHTML = '<span>APEX RUSH</span><strong>Impossible de charger la scène 3D.</strong><small>Vérifiez votre connexion et la compatibilité WebGL.</small>';
            return;
        }
        state.player.x = 920;
        state.player.y = 830;
        state.car.x = 840;
        state.car.y = 925;
        state.car.angle = -0.25;
        create3DCity();
        setPhase('awareness');
        updateDashboard();
        bindControls();
        requestAnimationFrame(frame);
    }

    initialize();
})();