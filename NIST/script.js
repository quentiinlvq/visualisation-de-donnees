// Configuration des dimensions et marges
const margin = { top: 20, right: 20, bottom: 30, left: 40 };
let width, height;

// Variables globales
let data = [];
let filteredData = [];
let selectedYear = 2022;
let selectedFamily = 'all';
let selectedScore = 0;

// Création du tooltip
const tooltip = d3.select("#tooltip");

// Création de la modal
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modal-content");
const closeBtn = document.getElementsByClassName("close")[0];

// Fonction pour charger et traiter les données
async function loadData() {
    try {
        // Création d'un input file
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.csv';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        // Création d'un bouton pour déclencher la sélection du fichier
        const loadButton = document.createElement('button');
        loadButton.textContent = 'Charger le fichier CSV';
        loadButton.style.position = 'fixed';
        loadButton.style.top = '20px';
        loadButton.style.right = '20px';
        loadButton.style.zIndex = '1000';
        loadButton.style.padding = '10px 20px';
        loadButton.style.backgroundColor = '#3498db';
        loadButton.style.color = 'white';
        loadButton.style.border = 'none';
        loadButton.style.borderRadius = '4px';
        loadButton.style.cursor = 'pointer';
        document.body.appendChild(loadButton);

        // Gestionnaire d'événements pour le bouton
        loadButton.onclick = () => fileInput.click();

        // Gestionnaire d'événements pour la sélection du fichier
        fileInput.onchange = (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const csvText = e.target.result;
                    console.log("Données CSV chargées:", csvText.substring(0, 200));
                    
                    data = d3.csvParse(csvText, d => ({
                        year: +d.Year,
                        date: new Date(d.Date),
                        controlSet: d.Control_Set,
                        control: d.Control,
                        controlName: d.Control_Name,
                        family: d.Control_Family_Code,
                        definition: d.Definition,
                        score: +d.Compliance_Score,
                        reportingDate: new Date(d.Reporting_Date),
                        objectId: +d.ObjectId
                    }));
                    
                    console.log("Données parsées:", data.length, "lignes");
                    
                    // Mise à jour des filtres
                    updateFilters();
                    
                    // Mise à jour initiale des visualisations
                    updateVisualizations();

                    // Suppression du bouton et de l'input
                    loadButton.remove();
                    fileInput.remove();
                };
                reader.readAsText(file);
            }
        };
    } catch (error) {
        console.error("Erreur détaillée lors du chargement des données:", error);
        showError(`Erreur lors du chargement des données: ${error.message}`);
    }
}

// Fonction pour mettre à jour les filtres
function updateFilters() {
    // Mise à jour du sélecteur de famille
    const families = [...new Set(data.map(d => d.family))].sort();
    const familySelect = d3.select("#familySelect");
    familySelect.selectAll("option")
        .data(families)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);

    // Mise à jour du slider d'année
    const years = [...new Set(data.map(d => d.year))].sort();
    d3.select("#yearSlider")
        .attr("min", d3.min(years))
        .attr("max", d3.max(years))
        .attr("value", selectedYear);
}

// Fonction pour filtrer les données
function filterData() {
    filteredData = data.filter(d => 
        d.year === selectedYear &&
        (selectedFamily === 'all' || d.family === selectedFamily) &&
        d.score >= selectedScore
    );
}

// Fonction pour mettre à jour toutes les visualisations
function updateVisualizations() {
    filterData();
    updateHeatmap();
    updateBarchart();
    updateRadarChart();
    updateLineChart();
    updateTable();
}

// Fonction pour la heatmap
function updateHeatmap() {
    const container = d3.select("#heatmap-container");
    container.selectAll("*").remove();

    const containerWidth = container.node().getBoundingClientRect().width;
    const containerHeight = container.node().getBoundingClientRect().height;
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    const svg = container.append("svg")
        .attr("width", containerWidth)
        .attr("height", containerHeight)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Création des échelles
    const families = [...new Set(filteredData.map(d => d.family))].sort();
    const controls = [...new Set(filteredData.map(d => d.control))].sort();

    const x = d3.scaleBand()
        .domain(controls)
        .range([0, width])
        .padding(0.01);

    const y = d3.scaleBand()
        .domain(families)
        .range([0, height])
        .padding(0.01);

    const color = d3.scaleSequential()
        .domain([0, 100])
        .interpolator(d3.interpolateRdYlGn);

    // Création de la heatmap
    svg.selectAll("rect")
        .data(filteredData)
        .enter()
        .append("rect")
        .attr("x", d => x(d.control))
        .attr("y", d => y(d.family))
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .style("fill", d => color(d.score))
        .on("mouseover", function(event, d) {
            d3.select(this)
                .style("stroke", "white")
                .style("stroke-width", 2);
            
            tooltip.style("opacity", 1)
                .html(`Contrôle: ${d.controlName}<br/>
                    Code: ${d.control}<br/>
                    Famille: ${d.family}<br/>
                    Score: ${d.score}%<br/>
                    Année: ${d.year}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this)
                .style("stroke", "none");
            tooltip.style("opacity", 0);
        });

    // Ajout des axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

    svg.append("g")
        .call(d3.axisLeft(y));
}

// Fonction pour le graphique en barres
function updateBarchart() {
    const container = d3.select("#barchart-container");
    container.selectAll("*").remove();

    const containerWidth = container.node().getBoundingClientRect().width;
    const containerHeight = container.node().getBoundingClientRect().height;
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    const svg = container.append("svg")
        .attr("width", containerWidth)
        .attr("height", containerHeight)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Tri des données par score
    const sortedData = [...filteredData].sort((a, b) => b.score - a.score);

    // Création des échelles
    const x = d3.scaleBand()
        .domain(sortedData.map(d => d.controlName))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);

    // Création des barres
    svg.selectAll("rect")
        .data(sortedData)
        .enter()
        .append("rect")
        .attr("x", d => x(d.controlName))
        .attr("y", d => y(d.score))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.score))
        .style("fill", d => d3.interpolateRdYlGn(d.score / 100))
        .on("click", function(event, d) {
            showModal(d);
        })
        .on("mouseover", function(event, d) {
            d3.select(this)
                .style("opacity", 0.8);
            
            tooltip.style("opacity", 1)
                .html(`Contrôle: ${d.controlName}<br/>
                    Code: ${d.control}<br/>
                    Score: ${d.score}%<br/>
                    Famille: ${d.family}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this)
                .style("opacity", 1);
            tooltip.style("opacity", 0);
        });

    // Ajout des axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

    svg.append("g")
        .call(d3.axisLeft(y));
}

// Fonction pour le radar chart
function updateRadarChart() {
    const container = d3.select("#radar-container");
    container.selectAll("*").remove();

    const containerWidth = container.node().getBoundingClientRect().width;
    const containerHeight = container.node().getBoundingClientRect().height;
    const size = Math.min(containerWidth, containerHeight) - margin.left - margin.right;

    const svg = container.append("svg")
        .attr("width", containerWidth)
        .attr("height", containerHeight)
        .append("g")
        .attr("transform", `translate(${containerWidth/2},${containerHeight/2})`);

    // Calcul des moyennes par famille
    const familyData = d3.group(filteredData, d => d.family);
    const familyScores = Array.from(familyData).map(([family, data]) => ({
        family,
        score: d3.mean(data, d => d.score)
    }));

    // Configuration du radar chart
    const angleSlice = Math.PI * 2 / familyScores.length;
    const radius = size / 2;

    // Création des cercles concentriques
    const levels = 5;
    for (let i = 1; i <= levels; i++) {
        const levelFactor = radius * i / levels;
        const levelData = familyScores.map(d => ({
            angle: familyScores.indexOf(d) * angleSlice,
            value: levelFactor
        }));

        svg.append("path")
            .datum(levelData)
            .attr("d", d3.lineRadial()
                .radius(d => d.value)
                .angle(d => d.angle - Math.PI / 2)
                .curve(d3.curveLinearClosed))
            .style("fill", "none")
            .style("stroke", "#ddd")
            .style("stroke-width", "1px");
    }

    // Création des axes
    const axes = svg.selectAll(".axis")
        .data(familyScores)
        .enter()
        .append("g")
        .attr("class", "axis");

    axes.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", d => radius * Math.cos(familyScores.indexOf(d) * angleSlice - Math.PI / 2))
        .attr("y2", d => radius * Math.sin(familyScores.indexOf(d) * angleSlice - Math.PI / 2))
        .style("stroke", "#ddd")
        .style("stroke-width", "1px");

    axes.append("text")
        .attr("x", d => radius * 1.1 * Math.cos(familyScores.indexOf(d) * angleSlice - Math.PI / 2))
        .attr("y", d => radius * 1.1 * Math.sin(familyScores.indexOf(d) * angleSlice - Math.PI / 2))
        .text(d => d.family)
        .style("text-anchor", "middle")
        .style("font-size", "12px");

    // Création du polygone des données
    const radarData = familyScores.map(d => ({
        angle: familyScores.indexOf(d) * angleSlice - Math.PI / 2,
        value: radius * (d.score / 100)
    }));

    svg.append("path")
        .datum(radarData)
        .attr("d", d3.lineRadial()
            .radius(d => d.value)
            .angle(d => d.angle)
            .curve(d3.curveLinearClosed))
        .style("fill", "rgba(52, 152, 219, 0.3)")
        .style("stroke", "#3498db")
        .style("stroke-width", "2px");
}

// Fonction pour le graphique en ligne
function updateLineChart() {
    const container = d3.select("#linechart-container");
    container.selectAll("*").remove();

    const containerWidth = container.node().getBoundingClientRect().width;
    const containerHeight = container.node().getBoundingClientRect().height;
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    const svg = container.append("svg")
        .attr("width", containerWidth)
        .attr("height", containerHeight)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Préparation des données
    const years = [...new Set(data.map(d => d.year))].sort();
    const families = [...new Set(data.map(d => d.family))].sort();

    // Création des échelles
    const x = d3.scaleLinear()
        .domain([d3.min(years), d3.max(years)])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);

    const color = d3.scaleOrdinal()
        .domain(families)
        .range(d3.schemeCategory10);

    // Création des lignes
    families.forEach(family => {
        const familyData = years.map(year => ({
            year,
            score: d3.mean(data.filter(d => d.family === family && d.year === year), d => d.score)
        }));

        svg.append("path")
            .datum(familyData)
            .attr("fill", "none")
            .attr("stroke", color(family))
            .attr("stroke-width", 2)
            .attr("d", d3.line()
                .x(d => x(d.year))
                .y(d => y(d.score))
                .curve(d3.curveMonotoneX));
    });

    // Ajout des axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    svg.append("g")
        .call(d3.axisLeft(y));

    // Ajout de la légende
    const legend = svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "start")
        .selectAll("g")
        .data(families)
        .enter().append("g")
        .attr("transform", (d, i) => `translate(0,${i * 20})`);

    legend.append("rect")
        .attr("x", width - 19)
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", color);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9.5)
        .attr("dy", "0.32em")
        .text(d => d);
}

// Fonction pour le tableau
function updateTable() {
    const container = d3.select("#table-container");
    container.selectAll("*").remove();

    const table = container.append("table");

    // En-têtes
    table.append("thead")
        .append("tr")
        .selectAll("th")
        .data(["Contrôle", "Nom", "Famille", "Score", "Année"])
        .enter()
        .append("th")
        .text(d => d)
        .on("click", function(d) {
            const column = ["control", "controlName", "family", "score", "year"].indexOf(d.toLowerCase());
            sortTable(column);
        });

    // Données
    table.append("tbody")
        .selectAll("tr")
        .data(filteredData)
        .enter()
        .append("tr")
        .on("click", function(event, d) {
            showModal(d);
        })
        .selectAll("td")
        .data(d => [d.control, d.controlName, d.family, d.score, d.year])
        .enter()
        .append("td")
        .text(d => d);
}

// Fonction pour trier le tableau
function sortTable(column) {
    const tbody = d3.select("#table-container table tbody");
    const rows = tbody.selectAll("tr")
        .data(filteredData.sort((a, b) => {
            const values = {
                0: (a, b) => a.control.localeCompare(b.control),
                1: (a, b) => a.controlName.localeCompare(b.controlName),
                2: (a, b) => a.family.localeCompare(b.family),
                3: (a, b) => b.score - a.score,
                4: (a, b) => b.year - a.year
            };
            return values[column](a, b);
        }))
        .order();

    rows.selectAll("td")
        .data(d => [d.control, d.controlName, d.family, d.score, d.year])
        .text(d => d);
}

// Fonction pour afficher la modal
function showModal(data) {
    modalContent.innerHTML = `
        <h3>Détails du contrôle</h3>
        <p><strong>Contrôle:</strong> ${data.control}</p>
        <p><strong>Nom:</strong> ${data.controlName}</p>
        <p><strong>Famille:</strong> ${data.family}</p>
        <p><strong>Score:</strong> ${data.score}%</p>
        <p><strong>Année:</strong> ${data.year}</p>
        <p><strong>Description:</strong> ${data.definition || "Non disponible"}</p>
    `;
    modal.style.display = "block";
}

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

// Gestionnaires d'événements
d3.select("#yearSlider").on("input", function() {
    selectedYear = +this.value;
    d3.select("#yearValue").text(selectedYear);
    updateVisualizations();
});

d3.select("#familySelect").on("change", function() {
    selectedFamily = this.value;
    updateVisualizations();
});

d3.select("#scoreSlider").on("input", function() {
    selectedScore = +this.value;
    d3.select("#scoreValue").text(selectedScore + "%");
    updateVisualizations();
});

closeBtn.onclick = function() {
    modal.style.display = "none";
};

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
};

// Gestion du redimensionnement de la fenêtre
window.addEventListener('resize', updateVisualizations);

// Chargement initial des données
loadData(); 