// Configuration des dimensions
const width = window.innerWidth - 40;
const height = window.innerHeight * 0.7;
const margin = { top: 20, right: 20, bottom: 30, left: 40 };

// Création du tooltip
const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Fonction pour afficher un message d'erreur
function showError(message) {
    const errorDiv = d3.select("body")
        .append("div")
        .attr("class", "error-message")
        .text(message);

    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Mapping des codes pays vers les noms complets
const countryNames = {
    "USA": "États-Unis",
    "GBR": "Royaume-Uni",
    "FRA": "France",
    "DEU": "Allemagne",
    "JPN": "Japon",
    "CAN": "Canada",
    "AUS": "Australie",
    "BRA": "Brésil",
    "CHN": "Chine",
    "IND": "Inde",
    "RUS": "Russie",
    "ZAF": "Afrique du Sud",
    "KOR": "Corée du Sud",
    "ITA": "Italie",
    "ESP": "Espagne"
};

// Liste des pays avec données
const countriesWithData = ["USA", "GBR", "FRA", "DEU", "JPN", "CAN", "AUS", "BRA", "CHN", "IND"];

// Données simulées pour plusieurs années
const multiYearData = {
    2020: {
        global_stats: {
            total_attacks: 1200000,
            success_rate: 0.12,
            average_loss: 3500,
            top_targets: ["Finance", "Healthcare", "Technology"]
        },
        country_data: [
            { country: "USA", attacks: 350000, losses: 1750000000, success_rate: 0.15 },
            { country: "GBR", attacks: 120000, losses: 600000000, success_rate: 0.12 },
            { country: "FRA", attacks: 100000, losses: 500000000, success_rate: 0.10 },
            { country: "DEU", attacks: 80000, losses: 400000000, success_rate: 0.11 },
            { country: "JPN", attacks: 60000, losses: 300000000, success_rate: 0.10 },
            { country: "CAN", attacks: 50000, losses: 250000000, success_rate: 0.09 },
            { country: "AUS", attacks: 45000, losses: 225000000, success_rate: 0.08 },
            { country: "BRA", attacks: 40000, losses: 200000000, success_rate: 0.11 },
            { country: "CHN", attacks: 35000, losses: 175000000, success_rate: 0.07 },
            { country: "IND", attacks: 30000, losses: 150000000, success_rate: 0.09 }
        ]
    },
    2021: {
        global_stats: {
            total_attacks: 1300000,
            success_rate: 0.13,
            average_loss: 3800,
            top_targets: ["Finance", "Healthcare", "Technology"]
        },
        country_data: [
            { country: "USA", attacks: 380000, losses: 1900000000, success_rate: 0.16 },
            { country: "GBR", attacks: 130000, losses: 650000000, success_rate: 0.13 },
            { country: "FRA", attacks: 110000, losses: 550000000, success_rate: 0.11 },
            { country: "DEU", attacks: 90000, losses: 450000000, success_rate: 0.12 },
            { country: "JPN", attacks: 70000, losses: 350000000, success_rate: 0.11 },
            { country: "CAN", attacks: 60000, losses: 300000000, success_rate: 0.10 },
            { country: "AUS", attacks: 55000, losses: 275000000, success_rate: 0.09 },
            { country: "BRA", attacks: 50000, losses: 250000000, success_rate: 0.12 },
            { country: "CHN", attacks: 45000, losses: 225000000, success_rate: 0.08 },
            { country: "IND", attacks: 40000, losses: 200000000, success_rate: 0.10 }
        ]
    },
    2022: {
        global_stats: {
            total_attacks: 1400000,
            success_rate: 0.14,
            average_loss: 4200,
            top_targets: ["Finance", "Healthcare", "Technology"]
        },
        country_data: [
            { country: "USA", attacks: 420000, losses: 2100000000, success_rate: 0.17 },
            { country: "GBR", attacks: 140000, losses: 700000000, success_rate: 0.14 },
            { country: "FRA", attacks: 115000, losses: 575000000, success_rate: 0.12 },
            { country: "DEU", attacks: 95000, losses: 475000000, success_rate: 0.13 },
            { country: "JPN", attacks: 75000, losses: 375000000, success_rate: 0.12 },
            { country: "CAN", attacks: 65000, losses: 325000000, success_rate: 0.11 },
            { country: "AUS", attacks: 60000, losses: 300000000, success_rate: 0.10 },
            { country: "BRA", attacks: 55000, losses: 275000000, success_rate: 0.13 },
            { country: "CHN", attacks: 50000, losses: 250000000, success_rate: 0.09 },
            { country: "IND", attacks: 45000, losses: 225000000, success_rate: 0.11 }
        ]
    },
    2023: {
        global_stats: {
            total_attacks: 1500000,
            success_rate: 0.15,
            average_loss: 4500,
            top_targets: ["Finance", "Healthcare", "Technology"]
        },
        country_data: [
            { country: "USA", attacks: 450000, losses: 2250000000, success_rate: 0.18 },
            { country: "GBR", attacks: 150000, losses: 750000000, success_rate: 0.15 },
            { country: "FRA", attacks: 120000, losses: 600000000, success_rate: 0.12 },
            { country: "DEU", attacks: 100000, losses: 500000000, success_rate: 0.14 },
            { country: "JPN", attacks: 80000, losses: 400000000, success_rate: 0.13 },
            { country: "CAN", attacks: 70000, losses: 350000000, success_rate: 0.12 },
            { country: "AUS", attacks: 65000, losses: 325000000, success_rate: 0.11 },
            { country: "BRA", attacks: 60000, losses: 300000000, success_rate: 0.14 },
            { country: "CHN", attacks: 55000, losses: 275000000, success_rate: 0.10 },
            { country: "IND", attacks: 50000, losses: 250000000, success_rate: 0.12 }
        ]
    }
};

// Données mensuelles pour chaque année
const monthlyData = {
    2020: [
        { month: "2020-01", attacks: 100000, success_rate: 0.12 },
        { month: "2020-02", attacks: 105000, success_rate: 0.13 },
        { month: "2020-03", attacks: 110000, success_rate: 0.14 },
        { month: "2020-04", attacks: 115000, success_rate: 0.13 },
        { month: "2020-05", attacks: 120000, success_rate: 0.15 },
        { month: "2020-06", attacks: 125000, success_rate: 0.14 }
    ],
    2021: [
        { month: "2021-01", attacks: 110000, success_rate: 0.13 },
        { month: "2021-02", attacks: 115000, success_rate: 0.14 },
        { month: "2021-03", attacks: 120000, success_rate: 0.15 },
        { month: "2021-04", attacks: 125000, success_rate: 0.14 },
        { month: "2021-05", attacks: 130000, success_rate: 0.16 },
        { month: "2021-06", attacks: 135000, success_rate: 0.15 }
    ],
    2022: [
        { month: "2022-01", attacks: 120000, success_rate: 0.14 },
        { month: "2022-02", attacks: 125000, success_rate: 0.15 },
        { month: "2022-03", attacks: 130000, success_rate: 0.16 },
        { month: "2022-04", attacks: 135000, success_rate: 0.15 },
        { month: "2022-05", attacks: 140000, success_rate: 0.17 },
        { month: "2022-06", attacks: 145000, success_rate: 0.16 }
    ],
    2023: [
        { month: "2023-01", attacks: 130000, success_rate: 0.15 },
        { month: "2023-02", attacks: 135000, success_rate: 0.16 },
        { month: "2023-03", attacks: 140000, success_rate: 0.17 },
        { month: "2023-04", attacks: 145000, success_rate: 0.16 },
        { month: "2023-05", attacks: 150000, success_rate: 0.18 },
        { month: "2023-06", attacks: 155000, success_rate: 0.17 }
    ]
};

let currentYear = 2023;
let currentData = multiYearData[currentYear];
let world;
let selectedCountry = null;

// Fonction pour mettre à jour les visualisations
function updateVisualizations() {
    if (!world) return;
    
    // Mise à jour de la carte
    updateMap();
    
    // Mise à jour des statistiques
    updateStats();
    
    // Mise à jour des tendances
    updateTrends();
}

// Fonction pour mettre à jour la carte
function updateMap() {
    const mapContainer = d3.select("#map-container");
    mapContainer.selectAll("*").remove();
    
    const svg = mapContainer.append("svg")
        .attr("width", width)
        .attr("height", height);

    const projection = d3.geoMercator()
        .fitSize([width, height], topojson.feature(world, world.objects.countries));

    const path = d3.geoPath().projection(projection);
    const countryData = new Map(currentData.country_data.map(d => [d.country, d]));

    svg.selectAll("path")
        .data(topojson.feature(world, world.objects.countries).features)
        .enter()
        .append("path")
        .attr("class", d => `country ${d.id === selectedCountry ? 'selected' : ''}`)
        .attr("d", path)
        .style("fill", d => {
            const data = countryData.get(d.id);
            return data ? d3.interpolateReds(data.success_rate) : "#3a3a3a";
        })
        .style("cursor", d => countriesWithData.includes(d.id) ? "pointer" : "default")
        .on("mouseover", function(event, d) {
            if (countriesWithData.includes(d.id)) {
                d3.select(this).style("fill", "#8B0000");
                const data = countryData.get(d.id);
                if (data) {
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    tooltip.html(`Pays: ${countryNames[d.id] || d.id}<br/>
                        Année: ${currentYear}<br/>
                        Attaques: ${data.attacks.toLocaleString()}<br/>
                        Pertes: ${data.losses.toLocaleString()}€<br/>
                        Taux de succès: ${(data.success_rate * 100).toFixed(1)}%`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                }
            }
        })
        .on("mouseout", function(event, d) {
            if (countriesWithData.includes(d.id)) {
                d3.select(this).style("fill", d => {
                    const data = countryData.get(d.id);
                    return d.id === selectedCountry ? "#FF0000" : (data ? d3.interpolateReds(data.success_rate) : "#3a3a3a");
                });
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            }
        })
        .on("click", function(event, d) {
            if (countriesWithData.includes(d.id)) {
                selectedCountry = d.id;
                const countryData = currentData.country_data.find(d => d.country === selectedCountry);
                if (countryData) {
                    updateVisualizations();
                } else {
                    showError(`Aucune donnée disponible pour ${countryNames[selectedCountry] || selectedCountry} en ${currentYear}`);
                    selectedCountry = null;
                }
            }
        });
}

// Fonction pour mettre à jour les statistiques
function updateStats() {
    const statsContainer = d3.select("#stats-container");
    statsContainer.selectAll("*").remove();

    // Création du tableau de statistiques
    const table = statsContainer.append("table")
        .attr("class", "stats-table");

    // En-têtes du tableau
    const headers = ["Pays", "Attaques", "Pertes", "Taux de succès"];
    table.append("tr")
        .selectAll("th")
        .data(headers)
        .enter()
        .append("th")
        .text(d => d)
        .on("click", function(d) {
            const column = headers.indexOf(d);
            sortTable(column);
        });

    // Données du tableau
    const rows = table.selectAll("tr")
        .data(currentData.country_data)
        .enter()
        .append("tr")
        .classed("selected", d => d.country === selectedCountry);

    rows.selectAll("td")
        .data(d => [
            countryNames[d.country] || d.country,
            d.attacks.toLocaleString(),
            d.losses.toLocaleString() + "€",
            (d.success_rate * 100).toFixed(1) + "%"
        ])
        .enter()
        .append("td")
        .text(d => d);

    // Ajout des informations détaillées si un pays est sélectionné
    if (selectedCountry) {
        const countryData = currentData.country_data.find(d => d.country === selectedCountry);
        if (countryData) {
            statsContainer.append("div")
                .attr("class", "country-info")
                .html(`
                    <h3>Informations détaillées pour ${countryNames[selectedCountry] || selectedCountry}</h3>
                    <p>Année: ${currentYear}</p>
                    <p>Nombre total d'attaques: ${countryData.attacks.toLocaleString()}</p>
                    <p>Pertes totales: ${countryData.losses.toLocaleString()}€</p>
                    <p>Taux de succès: ${(countryData.success_rate * 100).toFixed(1)}%</p>
                `);
        }
    }
}

// Fonction pour mettre à jour les tendances
function updateTrends() {
    const trendsContainer = d3.select("#trends-container");
    trendsContainer.selectAll("*").remove();

    const containerWidth = trendsContainer.node().getBoundingClientRect().width;
    const containerHeight = 300; // Hauteur fixe pour le graphique

    const svg = trendsContainer.append("svg")
        .attr("width", containerWidth)
        .attr("height", containerHeight);

    const x = d3.scalePoint()
        .domain(monthlyData[currentYear].map(d => d.month))
        .range([margin.left, containerWidth - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(monthlyData[currentYear], d => d.attacks)])
        .range([containerHeight - margin.bottom, margin.top]);

    const line = d3.line()
        .x(d => x(d.month))
        .y(d => y(d.attacks));

    // Ajout du titre
    svg.append("text")
        .attr("x", containerWidth / 2)
        .attr("y", margin.top)
        .attr("text-anchor", "middle")
        .attr("class", "graph-title")
        .text(`Évolution des attaques en ${currentYear}`);

    // Ajout de la ligne
    svg.append("path")
        .datum(monthlyData[currentYear])
        .attr("class", "trend-line")
        .attr("fill", "none")
        .attr("stroke", "#FF0000")
        .attr("stroke-width", 2)
        .attr("d", line);

    // Ajout des axes
    svg.append("g")
        .attr("transform", `translate(0,${containerHeight - margin.bottom})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("class", "axis-label")
        .style("text-anchor", "middle");

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        .selectAll("text")
        .attr("class", "axis-label");
}

// Fonction pour trier le tableau
function sortTable(column) {
    const tbody = d3.select("#stats-container table tbody");
    const rows = tbody.selectAll("tr")
        .data(currentData.country_data.sort((a, b) => {
            const values = {
                0: (a, b) => (countryNames[a.country] || a.country).localeCompare(countryNames[b.country] || b.country),
                1: (a, b) => b.attacks - a.attacks,
                2: (a, b) => b.losses - a.losses,
                3: (a, b) => b.success_rate - a.success_rate
            };
            return values[column](a, b);
        }))
        .order();

    rows.selectAll("td")
        .data(d => [
            countryNames[d.country] || d.country,
            d.attacks.toLocaleString(),
            d.losses.toLocaleString() + "€",
            (d.success_rate * 100).toFixed(1) + "%"
        ])
        .text(d => d);
}

// Gestionnaires d'événements pour les contrôles
d3.select("#yearSlider").on("input", function() {
    currentYear = +this.value;
    d3.select("#yearValue").text(currentYear);
    currentData = multiYearData[currentYear];
    if (selectedCountry) {
        const countryData = currentData.country_data.find(d => d.country === selectedCountry);
        if (!countryData) {
            showError(`Aucune donnée disponible pour ${countryNames[selectedCountry] || selectedCountry} en ${currentYear}`);
            selectedCountry = null;
        }
    }
    updateVisualizations();
});

d3.select("#sortSelect").on("change", function() {
    const column = ["country", "attacks", "losses", "success_rate"].indexOf(this.value);
    sortTable(column);
});

// Gestion du redimensionnement de la fenêtre
window.addEventListener('resize', function() {
    const newWidth = window.innerWidth - 40;
    const newHeight = window.innerHeight * 0.7;
    width = newWidth;
    height = newHeight;
    updateVisualizations();
});

// Chargement initial des données
d3.json("https://unpkg.com/world-atlas@2/countries-110m.json")
    .then(data => {
        world = data;
        updateVisualizations();
    })
    .catch(error => {
        console.error("Erreur lors du chargement des données:", error);
        showError("Erreur lors du chargement des données de la carte");
    }); 