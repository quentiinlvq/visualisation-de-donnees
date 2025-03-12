// Configuration des dimensions et marges
const margin = { top: 20, right: 20, bottom: 30, left: 40 };
let width, height;

// Variables globales
let data = [];
let filteredData = [];
let selectedYear = 2022;
let selectedTableYear = 'all';
let selectedFamily = 'all';
let selectedScore = 0;
let sortDirection = {}; // Pour stocker la direction du tri pour chaque colonne

// Création du tooltip
const tooltip = d3.select("#tooltip");

// Création de la modal
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modal-content");
const closeBtn = document.getElementsByClassName("close")[0];

// Fonction pour créer un sigle à partir d'un nom de contrôle
function createSigleFromName(controlName) {
    if (!controlName) return 'NA';
    // Diviser le nom en mots et prendre la première lettre de chaque mot
    return controlName
        .split(' ')
        .filter(word => word.length > 0 && !['and', 'or', 'the', 'of', 'to', 'in', 'on', 'at', 'by'].includes(word.toLowerCase()))
        .map(word => word[0].toUpperCase())
        .join('');
}

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
                    
                    // Standardisation des codes famille
                    data = d3.csvParse(csvText, d => {
                        let familyCode = d.Control_Family_Code;
                        
                        // Si pas de code famille ou code trop long, créer à partir du nom de contrôle
                        if (!familyCode || familyCode.length > 3) {
                            const controlName = d.Control_Name || '';
                            // Codes standards connus
                            if (controlName.includes('Access Control')) familyCode = 'AC';
                            else if (controlName.includes('Awareness and Training')) familyCode = 'AT';
                            else if (controlName.includes('Audit')) familyCode = 'AU';
                            else if (controlName.includes('Security Assessment')) familyCode = 'CA';
                            else if (controlName.includes('Configuration Management')) familyCode = 'CM';
                            else if (controlName.includes('Contingency Planning')) familyCode = 'CP';
                            else if (controlName.includes('Identification')) familyCode = 'IA';
                            else if (controlName.includes('Incident Response')) familyCode = 'IR';
                            else if (controlName.includes('Maintenance')) familyCode = 'MA';
                            else if (controlName.includes('Media Protection')) familyCode = 'MP';
                            else if (controlName.includes('Physical')) familyCode = 'PE';
                            else if (controlName.includes('Planning')) familyCode = 'PL';
                            else if (controlName.includes('Personnel Security')) familyCode = 'PS';
                            else if (controlName.includes('Risk Assessment')) familyCode = 'RA';
                            else if (controlName.includes('System and Services')) familyCode = 'SA';
                            else if (controlName.includes('System and Communications')) familyCode = 'SC';
                            else if (controlName.includes('System and Information')) familyCode = 'SI';
                            else if (controlName.includes('Supply Chain')) familyCode = 'SCRM';
                            else if (controlName.includes('Program Management')) familyCode = 'PM';
                            else {
                                // Créer un sigle à partir du nom pour les cas non standards
                                familyCode = createSigleFromName(controlName);
                            }
                        }

                        return {
                            year: +d.Year,
                            date: new Date(d.Date),
                            controlSet: d.Control_Set,
                            control: d.Control,
                            controlName: d.Control_Name,
                            family: familyCode,
                            definition: d.Definition,
                            score: +d.Compliance_Score,
                            reportingDate: new Date(d.Reporting_Date),
                            objectId: +d.ObjectId
                        };
                    });
                    
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
    
    // Mise à jour du sélecteur d'année pour le tableau
    const tableYearSelect = d3.select("#tableYearSelect");
    
    if (tableYearSelect.empty()) {
        const container = d3.select("#table-container");
        const filterDiv = container.insert("div", ":first-child")
            .attr("class", "table-filters")
            .style("margin-bottom", "10px");

        filterDiv.append("label")
            .attr("for", "tableYearSelect")
            .text("Filtrer par année : ");

        filterDiv.append("select")
            .attr("id", "tableYearSelect")
            .on("change", function() {
                selectedTableYear = this.value === 'all' ? 'all' : +this.value;
                updateTable();
            });

        const yearSelect = d3.select("#tableYearSelect");
        yearSelect.append("option")
            .attr("value", "all")
            .text("Toutes les années");

        years.forEach(year => {
            yearSelect.append("option")
                .attr("value", year)
                .text(year);
        });
    }
}

// Fonction pour filtrer les données
function filterData() {
    // Filtre pour les visualisations
    filteredData = data.filter(d => 
        (selectedYear === 'all' || d.year === selectedYear) &&
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
    const height = containerHeight - margin.top - 20 - margin.bottom;

    const svg = container.append("svg")
        .attr("width", containerWidth)
        .attr("height", containerHeight)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Préparation et agrégation des données
    const aggregatedData = d3.group(filteredData, d => d.family, d => d.control);
    const processedData = [];
    
    for (const [family, controls] of aggregatedData) {
        for (const [control, items] of controls) {
            const avgScore = d3.mean(items, d => d.score);
            processedData.push({
                family: family,
                control: control,
                score: avgScore,
                controlName: items[0].controlName,
                year: items[0].year
            });
        }
    }

    // Création des échelles
    const families = [...new Set(processedData.map(d => d.family))].sort();
    const controls = [...new Set(processedData.map(d => d.control))].sort();

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
        .data(processedData)
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
                    Score: ${d.score.toFixed(1)}%<br/>
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
    const height = containerHeight - margin.top - margin.bottom - 60;

    const svg = container.append("svg")
        .attr("width", containerWidth)
        .attr("height", containerHeight)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Agrégation des données par famille
    const aggregatedData = d3.group(filteredData, d => d.family);
    const processedData = Array.from(aggregatedData, ([family, items]) => ({
        family: family,
        score: d3.mean(items, d => d.score),
        controlName: items[0].controlName,
        control: items[0].control,
        year: items[0].year
    }));

    // Tri des données par score
    const sortedData = processedData.sort((a, b) => b.score - a.score);

    // Création des échelles
    const x = d3.scaleBand()
        .domain(sortedData.map(d => d.family))
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
        .attr("x", d => x(d.family))
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
                .html(`Famille: ${d.family}<br/>
                    Score moyen: ${d.score.toFixed(1)}%`)
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
        .style("text-anchor", "middle");

    svg.append("g")
        .call(d3.axisLeft(y));

    // Ajout de la légende dans le même SVG
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(0,${height + 40})`);

    legend.append("rect")
        .attr("width", width)
        .attr("height", 30)
        .style("fill", "rgba(255, 255, 255, 0.9)")
        .style("rx", 5);

    legend.append("text")
        .attr("x", width/2)
        .attr("y", 20)
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Score de conformité");
}

// Fonction pour le radar chart
function updateRadarChart() {
    const container = d3.select("#radar-container");
    container.selectAll("*").remove();

    const containerWidth = container.node().getBoundingClientRect().width;
    const containerHeight = container.node().getBoundingClientRect().height;
    const size = Math.min(containerWidth, containerHeight) - margin.left - margin.right - 60;

    const svg = container.append("svg")
        .attr("width", containerWidth)
        .attr("height", containerHeight)
        .append("g")
        .attr("transform", `translate(${containerWidth/2},${containerHeight/2})`);

    // Calcul des moyennes par famille
    const familyData = d3.group(filteredData, d => d.family);
    const familyScores = Array.from(familyData).map(([family, data]) => ({
        family,
        score: d3.mean(data, d => d.score),
        controlName: data[0].controlName
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

    // Ajout des labels avec tooltip
    axes.append("text")
        .attr("x", d => radius * 1.1 * Math.cos(familyScores.indexOf(d) * angleSlice - Math.PI / 2))
        .attr("y", d => radius * 1.1 * Math.sin(familyScores.indexOf(d) * angleSlice - Math.PI / 2))
        .text(d => d.family)
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .on("mouseover", function(event, d) {
            tooltip.style("opacity", 1)
                .html(`Famille: ${d.family}<br/>
                    Nom complet: ${d.controlName}<br/>
                    Score moyen: ${d.score.toFixed(1)}%`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("opacity", 0);
        });

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

    // Ajout de la légende avec plus d'espace
    const legend = container.append("div")
        .attr("class", "legend")
        .style("margin-top", "30px")
        .style("margin-bottom", "30px")
        .style("padding", "15px")
        .style("text-align", "center")
        .style("background-color", "rgba(255, 255, 255, 0.9)")
        .style("border-radius", "5px");

    legend.append("span")
        .style("display", "inline-block")
        .style("margin", "5px 10px")
        .style("font-size", "12px")
        .append("span")
        .style("display", "inline-block")
        .style("width", "12px")
        .style("height", "12px")
        .style("background-color", "rgba(52, 152, 219, 0.3)")
        .style("border", "2px solid #3498db")
        .style("margin-right", "5px")
        .style("vertical-align", "middle");

    legend.append("text")
        .text("Score moyen par famille");
}

// Fonction pour le graphique en ligne
function updateLineChart() {
    const container = d3.select("#linechart-container");
    container.selectAll("*").remove();

    const containerWidth = container.node().getBoundingClientRect().width;
    const containerHeight = container.node().getBoundingClientRect().height;
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom - 60;

    const svg = container.append("svg")
        .attr("width", containerWidth)
        .attr("height", containerHeight)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Préparation des données
    const years = [...new Set(data.map(d => d.year))]
        .sort()
        .filter(year => year >= 2016 && year <= 2020);
    const families = [...new Set(data.map(d => d.family))].sort();

    // Création des échelles
    const x = d3.scaleTime()
        .domain([new Date(2016, 0, 1), new Date(2020, 11, 31)])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);

    const color = d3.scaleOrdinal()
        .domain(families)
        .range(d3.schemeCategory10);

    // Création des lignes
    families.forEach(family => {
        const familyData = years.map(year => {
            const yearData = data.filter(d => d.family === family && d.year === year);
            return {
                year: new Date(year, 0, 1),
                score: yearData.length > 0 ? d3.mean(yearData, d => d.score) : null
            };
        }).filter(d => d.score !== null);

        if (familyData.length > 1) {
            svg.append("path")
                .datum(familyData)
                .attr("fill", "none")
                .attr("stroke", color(family))
                .attr("stroke-width", 2)
                .attr("d", d3.line()
                    .x(d => x(d.year))
                    .y(d => y(d.score))
                    .curve(d3.curveMonotoneX));
        }
    });

    // Ajout des axes avec format mm/yyyy
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x)
            .tickFormat(d3.timeFormat("%m/%Y")));

    svg.append("g")
        .call(d3.axisLeft(y));

    // Ajout de la légende dans le même SVG
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(0,${height + 40})`);

    const legendSpacing = 75; // Espacement horizontal entre les éléments
    const legendRowHeight = 15; // Hauteur entre les lignes
    const itemsPerRow = 8; // Nombre d'éléments par ligne

    families.forEach((family, i) => {
        const row = Math.floor(i / itemsPerRow);
        const col = i % itemsPerRow;

        const legendItem = legend.append("g")
            .attr("transform", `translate(${col * legendSpacing}, ${row * legendRowHeight})`);

        legendItem.append("rect")
            .attr("width", 12)
            .attr("height", 12)
            .attr("x", 0)
            .attr("y", 5)
            .style("fill", color(family));

        legendItem.append("text")
            .attr("x", 20)
            .attr("y", 15)
            .style("font-size", "12px")
            .text(family);
    });
}

// Fonction pour le tableau
function updateTable() {
    const container = d3.select("#table-container");
    container.select("table").remove(); // Ne supprime que la table, pas les filtres

    const table = container.append("table");

    // Filtrer les données pour le tableau
    const tableData = data.filter(d => 
        (selectedTableYear === 'all' || d.year === selectedTableYear) &&
        (selectedFamily === 'all' || d.family === selectedFamily) &&
        d.score >= selectedScore
    );

    // En-têtes
    table.append("thead")
        .append("tr")
        .selectAll("th")
        .data(["Contrôle", "Nom", "Famille", "Score", "Année"])
        .enter()
        .append("th")
        .text(d => d)
        .style("cursor", "pointer")
        .on("click", function(event, d) {
            const column = d.toLowerCase();
            sortTable(column, tableData);
        });

    // Données
    table.append("tbody")
        .selectAll("tr")
        .data(tableData)
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
function sortTable(column, tableData) {
    if (!sortDirection[column]) {
        sortDirection[column] = 'desc';
    } else {
        sortDirection[column] = sortDirection[column] === 'asc' ? 'desc' : 'asc';
    }

    const tbody = d3.select("#table-container table tbody");
    const rows = tbody.selectAll("tr")
        .data(tableData.sort((a, b) => {
            const direction = sortDirection[column] === 'asc' ? 1 : -1;
            switch(column) {
                case 'contrôle':
                    return direction * a.control.localeCompare(b.control);
                case 'nom':
                    return direction * a.controlName.localeCompare(b.controlName);
                case 'famille':
                    return direction * a.family.localeCompare(b.family);
                case 'score':
                    return direction * (a.score - b.score);
                case 'année':
                    return direction * (a.year - b.year);
                default:
                    return 0;
            }
        }))
        .order();

    rows.selectAll("td")
        .data(d => [d.control, d.controlName, d.family, d.score, d.year])
        .text(d => d);

    // Mettre à jour l'indicateur de tri dans l'en-tête
    d3.selectAll("#table-container th")
        .text(function(d) {
            const originalText = d;
            if (d.toLowerCase() === column) {
                return `${originalText} ${sortDirection[column] === 'asc' ? '▲' : '▼'}`;
            }
            return originalText;
        });
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