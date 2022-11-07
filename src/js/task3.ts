import data from "../data"
import * as d3 from "d3"
import * as d3Array from "d3-array"
import * as d3TimeFormat from "d3-time-format"

type Datum = typeof data[number]
const dateParser = d3TimeFormat.timeParse("%Y")
const yearAccessor = (d: Datum) => d.Year
const medalAccessor = (d: Datum) => d.Medal
const ageAccessor = (d: Datum) => d.Age
const heightAccessor = (d: Datum) => d.Height
const weightAccessor = (d: Datum) => d.Weight
const genderAccessor = (d: Datum) => d.Gender
const sportAccessor = (d: Datum) => d.Sport
const countryAccessor = (d: Datum) => d.Team

// 5. Build an Interactive Dashboard

function combineChartDimensions(dimensions: any) {
  const parsedDimensions = {
    height: dimensions.height,
    width: dimensions.width,
    ...dimensions,
    margins: { top: 40, right: 30, bottom: 40, left: 75, ...dimensions?.margins },
  }

  return {
    ...parsedDimensions,
    boundedHeight: Math.max(
      parsedDimensions.height - parsedDimensions.margins.top - parsedDimensions.margins.bottom,
      0
    ),
    boundedWidth: Math.max(parsedDimensions.width - parsedDimensions.margins.left - parsedDimensions.margins.right, 0),
  }
}

function getFilteredData(dataset: typeof data) {
  let filteredData = dataset
  if (state.year !== "None") {
    filteredData = filteredData.filter((d) => yearAccessor(d) === +state.year)
  }
  if (state.country !== "None") {
    filteredData = filteredData.filter((d) => countryAccessor(d) === state.country)
  }
  if (state.sport !== "None") {
    filteredData = filteredData.filter((d) => sportAccessor(d) === state.sport)
  }
  return filteredData
}

const CHART_COLORS = [
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
  "--chart-6",
  "--chart-7",
  "--chart-8",
  "--chart-9",
  "--chart-10",
] as const

function getAggregatedData(dataset: typeof data) {
  const groupedData = d3Array.group(dataset, countryAccessor, yearAccessor)
  const groupedByCountry = Object.fromEntries(groupedData.entries())

  const countriesGroupedByYear = Object.fromEntries(
    Object.entries(groupedByCountry).map(([country, years], idx) => {
      const color = CHART_COLORS[idx % CHART_COLORS.length]

      const groupedByYear = Object.fromEntries(Array.from(years as any)) as Record<string, Datum[]>

      const yearlyAggregations = Object.entries(groupedByYear).map(([year, items]: [string, typeof data]) => {
        return {
          year: +year,
          country,
          color,
          medals: items.length,
          gold: items.filter((d) => d.Medal === "Gold").length,
          silver: items.filter((d) => d.Medal === "Silver").length,
          bronze: items.filter((d) => d.Medal === "Bronze").length,
          averageAge: d3Array.mean(items, ageAccessor),
          averageHeight: d3Array.mean(items, heightAccessor),
          averageWeight: d3Array.mean(items, weightAccessor),
        }
      })

      return [
        country,
        {
          ...groupedByYear,
          yearlyAggregations: yearlyAggregations,
        },
      ] as [string, typeof groupedByYear & { yearlyAggregations: typeof yearlyAggregations }]
    })
  )

  const aggregatedData = Object.fromEntries(
    Object.entries(countriesGroupedByYear).map(([country, years], i) => {
      const allYears = Object.entries(years)
        .filter(([year, items]) => year !== "yearlyAggregations")
        .map(([year, items]) => items)
        .flat() as Datum[]

      const color = CHART_COLORS[i % CHART_COLORS.length]

      const countryAggregations = {
        country,
        color,
        medals: allYears.length,
        gold: allYears.filter((d) => d.Medal === "Gold").length,
        silver: allYears.filter((d) => d.Medal === "Silver").length,
        bronze: allYears.filter((d) => d.Medal === "Bronze").length,
        averageAge: d3Array.mean(allYears, (d) => d.Age),
        averageHeight: d3Array.mean(allYears, (d) => d.Height),
        averageWeight: d3Array.mean(allYears, (d) => d.Weight),
      }

      return [
        country,
        {
          ...years,
          aggregations: countryAggregations,
        },
      ]
    })
  )

  return aggregatedData
}

const NUM_COUNTRIES = 10

function getSortedAggregations(dataset: typeof data) {
  const aggregatedData = getAggregatedData(dataset)
  const totalAggregations = Object.entries(aggregatedData).map(([country, data]) => data.aggregations)
  const topCountries = d3Array
    .sort(totalAggregations, (a, b) => d3Array.descending(a.medals, b.medals))
    .slice(0, NUM_COUNTRIES)
    .map((d) => d.country)

  const aggregations = Object.entries(aggregatedData)
    .map(([country, data]) => data.yearlyAggregations)
    .flat()
  const sortedAggregations = d3Array
    .sort(aggregations, (a, b) => b.medals - a.medals)
    .filter((d) => topCountries.includes(d.country))
    .map((d) => ({ ...d, year: Date.UTC(d.year, 0, 1) }))

  return { sortedAggregations, topCountries, totalAggregations }
}

function Scatterplot(dataset: typeof data, width: number, height: number) {
  // 2. handle data
  const { sortedAggregations } = getSortedAggregations(dataset)

  // 3. create chart dims
  const margins = { top: 40, right: 30, bottom: 40, left: 75 }
  const dims = { width, height, margins }
  const dimensions = combineChartDimensions(dims)

  // 4. create scales
  const averageAgeExtent = d3.extent(sortedAggregations, (d) => d.averageAge)
  const ageMin = averageAgeExtent[0] ?? 7
  const ageMax = averageAgeExtent[1] ?? 120
  const maxGoldMedals = d3.max(sortedAggregations, (d) => d.gold) ?? 50
  const xScale = d3
    .scaleLinear()
    .domain([ageMin - 5, ageMax + 10])
    .range([0, dimensions.boundedWidth - margins.right])
  const yScale = d3
    .scaleLinear()
    .domain([0, maxGoldMedals + 5])
    .range([dimensions.boundedHeight, margins.top])
    .nice()

  // 5. create scaled accessors
  const xAccessorScaled = (d: typeof sortedAggregations[0]) => xScale(d.averageAge ?? 7)
  const yAccessorScaled = (d: typeof sortedAggregations[0]) => yScale(d.gold)

  // 6. create chart
  const svg = d3
    .select("#dashboard-plot1")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height)

  const xAxisGenerator = d3.axisBottom(xScale)
  const yAxisGenerator = d3.axisLeft(yScale)

  svg
    .append("g")
    .attr("transform", `translate(${margins.left}, ${dimensions.boundedHeight + 10})`)
    .call(xAxisGenerator)

  svg.append("g").attr("transform", `translate(${margins.left}, 0)`).call(yAxisGenerator)

  // ----------------
  // Create a tooltip
  // ----------------
  const tooltip = d3
    .select("#scatterplot")
    .append("div")
    .style("opacity", 0.95)
    .attr("class", "tooltip")
    .attr("transform", `translate(${margins.left}, ${margins.top})`)
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("position", "absolute")
    .style("top", 0)
    .style("left", 0)
    .style("display", "none")

  const bounds = svg.append("g").attr("transform", `translate(${margins.left}, 0)`)
  bounds
    .selectAll("circle")
    .data(sortedAggregations)
    .enter()
    .append("circle")
    .attr("cx", xAccessorScaled)
    .attr("cy", yAccessorScaled)
    .attr("r", 3)
    .attr("fill", (d) => `var(${d.color})`)
    .style("cursor", "pointer")
    .on("mouseover", function (event, d) {
      tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top", yScale(d.gold) + 10 + "px")
        .style("display", "flex")
        .html(
          `<div>
              <span class="bold">${d.country}</span> in  <span class="bold">${new Date(
            d.year
          ).getFullYear()}</span> with  <span class="bold">${d.medals}</span> medals
            </div>
          `
        )
    })
    .on("mouseexit", function (event, d) {
      tooltip.style("display", "none")
    })
}

function GroupedBarChart(dataset: typeof data, width: number, height: number) {
  // 2. handle data
  const { totalAggregations } = getSortedAggregations(dataset)

  // 3. create chart dims
  const margins = { top: 40, right: 30, bottom: 40, left: 75 }
  const dims = { width, height, margins }
  const dimensions = combineChartDimensions(dims)

  // 6. create chart
  const svg = d3
    .select("#dashboard-plot2")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height)

  const selectedData = totalAggregations.slice(0, 10)

  const bars = svg.append("g").selectAll("g").data(selectedData)

  const x0Scale = d3
    .scaleBand()
    .domain(selectedData.map((d) => d.country))
    .rangeRound([margins.left, dimensions.boundedWidth - margins.right])
    .paddingInner(0.15)

  const medals = ["Gold", "Silver", "Bronze"].map((v) => v.toLowerCase())

  const x1Scale = d3.scaleBand().domain(medals).rangeRound([0, x0Scale.bandwidth()]).padding(0.05)

  const maxGold = d3.max(selectedData, (d) => d.gold) ?? 0
  const maxSilver = d3.max(selectedData, (d) => d.silver) ?? 0
  const maxBronze = d3.max(selectedData, (d) => d.bronze) ?? 0
  const maxAll = Math.max(maxGold, maxSilver, maxBronze)

  const yScale = d3
    .scaleLinear()
    .domain([0, maxAll])
    .rangeRound([dimensions.boundedHeight - margins.top, margins.top])
    .nice()

  const xAxisGenerator = d3.axisBottom(x0Scale)
  const yAxisGenerator = d3.axisLeft(yScale)

  svg
    .append("g")
    .attr("transform", `translate(0, ${dimensions.boundedHeight - margins.bottom})`)
    .call(xAxisGenerator)
    .selectAll("text")
    .attr("y", 0)
    .attr("x", 9)
    .attr("dy", ".35em")
    .attr("transform", "rotate(90)")
    .style("text-anchor", "start")

  svg.append("g").attr("transform", `translate(${margins.left}, 0)`).call(yAxisGenerator)

  // ----------------
  // Create a tooltip
  // ----------------
  const tooltip = d3
    .select("#groupedbar")
    .append("div")
    .style("opacity", 0.95)
    .attr("class", "tooltip")
    .attr("transform", `translate(${margins.left}, ${margins.top})`)
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("position", "absolute")
    .style("top", 0)
    .style("left", 0)
    .style("display", "none")

  bars
    .join("g")
    .attr("transform", (d) => `translate(${x0Scale(d.country)},0)`)
    .selectAll("rect")
    .data((d) =>
      medals.map((medal) => ({
        medal,
        country: d.country,
        value: d[medal as keyof typeof d] ?? 0,
      }))
    )
    .join("rect")
    .attr("x", (d) => x1Scale(d.medal) ?? 0)
    .attr("y", (d) => (d.value ? yScale(Number(d.value ?? 0)) : margins.top))
    .attr("width", x1Scale.bandwidth())
    .attr("height", (d) => (d.value ? yScale(0) - yScale(Number(d.value ?? 0)) : 0))
    .attr("fill", (d) => `var(--${d.medal})`)
    .on("mouseover", function (event, d) {
      tooltip
        .style("left", (x0Scale(d?.country ?? "USA") ?? 0) + 1 + "px")
        .style("top", yScale(Number(d.value || 0)) + 1 + "px")
        .style("display", "flex")
        .html(
          `<div>
              <span class="bold">${d.country}</span> with <span class="bold">${d.value}</span> total <span class="bold">${d.medal}</span> medals
            </div>
          `
        )
    })
    .on("mouseexit", function (event, d) {
      tooltip.style("display", "none")
    })
}

function Timeline(dataset: typeof data, width: number, height: number) {
  // 2. handle data
  const { sortedAggregations } = getSortedAggregations(dataset)

  // 3. create chart dims
  const margins = { top: 40, right: 30, bottom: 40, left: 75 }
  const dims = { width, height, margins }
  const dimensions = combineChartDimensions(dims)

  // 4. create scales
  const yearExtent = d3.extent(sortedAggregations, (d) => d.year)
  const yearMin = yearExtent[0] ?? 1910
  const maxMedals = d3.max(sortedAggregations, (d) => d.medals) ?? 100
  const xScale = d3
    .scaleTime()
    .domain([yearMin, Date.UTC(2020, 0, 1)])
    .range([0, dimensions.boundedWidth - margins.right])
  const yScale = d3
    .scaleLinear()
    .domain([0, maxMedals + 5])
    .range([dimensions.boundedHeight, margins.top])
    .nice()

  // 5. create scaled accessors
  const xAccessorScaled = (d: typeof sortedAggregations[0]) => xScale(d.year)
  const yAccessorScaled = (d: typeof sortedAggregations[0]) => yScale(d.medals)

  // 6. create chart
  const svg = d3
    .select("#dashboard-plot3")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height)

  const xAxisGenerator = d3.axisBottom(xScale)
  const yAxisGenerator = d3.axisLeft(yScale) // .ticks(5)

  svg
    .append("g")
    .attr("transform", `translate(${margins.left}, ${dimensions.boundedHeight + 10})`)
    .call(xAxisGenerator)

  svg.append("g").attr("transform", `translate(${margins.left}, 0)`).call(yAxisGenerator)

  const lineGenerator = d3
    .line<typeof sortedAggregations[0]>()
    .x((d) => xAccessorScaled(d) ?? 0)
    .y((d) => yAccessorScaled(d) ?? 0)
    .curve(d3.curveMonotoneX)

  const lineData = Object.fromEntries(
    Array.from(d3Array.group(sortedAggregations, (d) => d.country)).map(([country, data]) => [
      country,
      {
        data,
        line: lineGenerator(d3Array.sort(data, (a, b) => d3Array.ascending(a.year, b.year))),
      },
    ])
  )

  const bounds = svg.append("g").attr("transform", `translate(${margins.left}, 0)`)
  bounds
    .selectAll("path")
    .data(Object.values(lineData))
    .enter()
    .append("path")
    .attr("d", (d) => d.line)
    .attr("fill", "none")
    .attr("stroke", (d, i) => d3.schemeCategory10[i])
    .attr("stroke-width", 2)
    .attr("class", "line")

  // ----------------
  // Create a tooltip
  // ----------------
  const tooltip = d3
    .select("#timeline")
    .append("div")
    .style("opacity", 0.95)
    .attr("class", "tooltip")
    .attr("transform", `translate(${margins.left}, ${margins.top})`)
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("position", "absolute")
    .style("top", 0)
    .style("left", 0)
    .style("display", "none")

  bounds
    .selectAll("circle")
    .data(sortedAggregations)
    .enter()
    .append("circle")
    .attr("cx", (d) => xAccessorScaled(d) ?? 0)
    .attr("cy", (d) => yAccessorScaled(d) ?? 0)
    .attr("r", 3)
    .attr("fill", "black")
    .style("cursor", "pointer")
    .on("mouseover", function (event, d) {
      tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top", yScale(d.medals) + "px")
        .style("display", "flex")
        .html(
          `<div>
              <span class="bold">${d.country}</span> in  <span class="bold">${new Date(
            d.year
          ).getFullYear()}</span> with  <span class="bold">${d.medals}</span> medals
            </div>
          `
        )
    })
    .on("mouseexit", function (event, d) {
      tooltip.style("display", "none")
    })
}

function Dashboard(dataset: typeof data) {
  //
  const filteredData = getFilteredData(dataset)

  const timeline = document.querySelector("#dashboard-plot1")
  timeline!.innerHTML = ""
  const timelineDims = timeline!.getBoundingClientRect()
  const timelineWidth = timelineDims?.width ?? 1200
  const timelineHeight = timelineDims?.height ?? 500

  const groupedBar = document.querySelector("#dashboard-plot2")
  groupedBar!.innerHTML = ""
  const groupedBarDims = groupedBar!.getBoundingClientRect()
  const groupedBarWidth = groupedBarDims?.width ?? 700
  const groupedBarheight = groupedBarDims?.height ?? 500

  const scatterplot = document.querySelector("#dashboard-plot3")
  scatterplot!.innerHTML = ""
  const scatterplotDims = scatterplot!.getBoundingClientRect()
  const scatterplotWidth = scatterplotDims?.width ?? 500
  const scatterplotHeight = scatterplotDims?.height ?? 500

  Timeline(filteredData, timelineWidth, timelineHeight)
  GroupedBarChart(filteredData, groupedBarWidth, groupedBarheight)
  Scatterplot(filteredData, scatterplotWidth, scatterplotHeight)
}

const state = {
  year: "None",
  country: "None",
  sport: "None",
}

// year dropdown
const yearDropdown = document.querySelector("#dashboard-plot1")
function handleYearDropdownChange(e: any) {
  state.year = e.target.value
  Dashboard(data)
}
// country dropdown
const countryDropdown = document.querySelector("#dashboard-plot2")
function handleCountryDropdownChange(e: any) {
  state.country = e.target.value
  Dashboard(data)
}
// sport dropdown
const sportDropdown = document.querySelector("#dashboard-plot3")
function handlSportDropdownChange(e: any) {
  state.sport = e.target.value
  Dashboard(data)
}

// populate dropdowns
function populateDropdowns(dataset: typeof data) {
  const years = d3Array.sort([...new Set(dataset.map((d) => yearAccessor(d)))], (a, b) => b - a)
  const countries = [...new Set(dataset.map((d) => countryAccessor(d)))]
  const sports = [...new Set(dataset.map((d) => sportAccessor(d)))]

  // year dropdown
  const option = document.createElement("option")
  option.value = "None"
  option.text = "None"
  yearDropdown!.appendChild(option)
  for (const year of years) {
    const option = document.createElement("option")
    option.value = String(year)
    option.text = String(year)
    yearDropdown!.appendChild(option)
  }

  // country dropdown
  const option2 = document.createElement("option")
  option2.value = "None"
  option2.text = "None"
  countryDropdown!.appendChild(option2)
  for (const country of countries) {
    const option2 = document.createElement("option")
    option2.value = country
    option2.text = country
    countryDropdown!.appendChild(option2)
  }

  // sport dropdown
  const option4 = document.createElement("option")
  option4.value = "None"
  option4.text = "None"
  sportDropdown!.appendChild(option4)
  for (const sport of sports) {
    const option4 = document.createElement("option")
    option4.value = sport
    option4.text = sport
    sportDropdown!.appendChild(option4)
  }

  // event listeners
  yearDropdown!.addEventListener("change", handleYearDropdownChange)
  countryDropdown!.addEventListener("change", handleCountryDropdownChange)
  sportDropdown!.addEventListener("change", handlSportDropdownChange)
}

window.onload = function () {
  populateDropdowns(data)
  Dashboard(data)
}

// 6. Extract Insight from Aggregated Data

// Questions:

// How old were the youngest male and female participants of the 2002 olympics? Select their name, gender, and age.
// What sport has the tallest average athlete?
// Let's look at some runner ups. What athletes from the United States have won at least 3 non-gold medals and what sport did they win them in?

// 1. How many medals did Norway win in each of the Winter Olympics since the year 2000? Select the year and number of medals.
// 2. Select the year and the total number of unique events in every Winter Olympics since it began. Sort the results bu number of unique events in descending order .
// 3. Time to see which countries dominated in particular Olympic tournaments. Find the team, city, year`, and total number of unique events each country won gold medals in.
//    Sort the results by number of gold medals in descending order and take only the first 20 rows.
// 4. Find the team, city, year, and total number of unique events each country won silver medals in. Sort the results by number of silver medals in descending order and take only the first 20 rows.
// 5. Let's examine the countries that are no longer active in the Winter Olympics, or have been down on their luck in the last few decades.
// Find the team, total number of medals, and the rounded average height of all winter olympics participants from that team.
// Filter the results to only include countries where no participant from that country has won a medal in an event after the year 1990.
// Sort the results by the number of medals they won.

// 1a. How old were the youngest male and female participants of the 1996 Olympics? How about the oldest?
// 1b. Visualize the distribution of ages in the 1996 Olympics. Visualize the distribution of ages for male and female participants of the 1996 Olympics.
// 2a. What was the percentage of male gymnasts among all the male participants of the 2000 Olympics? Consider only Gymnastics as a target sport. Round the answer to the first decimal.
// 3. What are the mean and standard deviation of height for female basketball players participated in the 2000 Olympics? Round the answer to the first decimal.
// 4a. Find the sportsperson that participated in the 2002 Olympics, with the highest weight among other participants of the same Olympics. What sport did he or she do?
// 4b. Make a DataFrame that aggregates Gold medals for each individual athelte. Create a scatterplot that compares the height of athletes to the number of gold medals they win.
// 5a. How many silver medals in tennis did sportspeople from the Australia team win at the 2000 Olympics? Count every medal from every sportsperson.
// 5b. Create a barplot for gold medals the United States women have won over the last 20 years. Create one for the men as well.
// 6a. Is it true that Switzerland won fewer medals than Serbia at the 2016 Olympics? Do not consider NaN values in Medal column.
// 6b. Create a bar graph for the top 20 athletes in terms of total medal count.
// 7a. What age category did the fewest and the most participants of the 2014 Olympics belong to?
// 7b. Create a DataFrame subset that groups individual athletes and adds up their total medal count. Then plot the top 20 athletes in terms of total medal count in descending order.
// 8b. Create a scatterplot of height vs medal count and weight vs medal count.
