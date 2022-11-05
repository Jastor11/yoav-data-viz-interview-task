// const data = require("./data/winter_olympics.json")
import data from "../data"
import * as d3 from "d3"
import * as d3Array from "d3-array"

// 1. Data Munging

function processData() {
  // 1.1. Filter out the data we don't need
  // const filteredData = data.filter((d) => d["Medal"] !== "NA")

  // const g = d3Array.group(filteredData, (d) => d["Country"])

  // 1.2. Group the data by country
  // const groupedData = d3
  //   .nest()
  //   .key((d) => d["Country"])
  //   .entries(filteredData)
  // const groupedData = d3Nest()
  // const groupedData = d3Array.group(data, (d) => d.Team)
  // const groupedData = d3Array.index(data, (d) => d.Team)
  const groupedData = d3Array.group(data, (d) => d.Team)

  // 1.3. Sum the number of medals per country
  // const summedData = groupedData.map((d) => {
  //   return {
  //     country: d.key,
  //     medals: d.values.length,
  //   }
  // })
  const summedData = Object.entries(groupedData).map(([key, value]) => {
    return {
      country: key,
      medals: value.length,
    }
  })

  // 1.4. Sort the data by number of medals
  const sortedData = summedData.sort((a, b) => b.medals - a.medals)

  // 1.5. Return the top 10 countries
  return sortedData.slice(0, 10)
}

// 2. Data Analysis

function displayDataPreview() {
  // 2.1. Get the data for the most recent olympics
  const maxYear = d3Array.max(data, (d) => d.Year)
  const filteredData = data.filter((d) => d.Year === maxYear)

  // 2.2. Add Headers to the table for each column in the data
  const cols = Object.keys(filteredData[0])
  // const tableHeader = d3.select("thead").append("tr")
  const tableHeader = d3.select("#preview table thead").append("tr")
  tableHeader
    .selectAll("th")
    .data(cols)
    .enter()
    .append("th")
    .text((d) => d)

  // 2.3. Add a row to the table for the first 10 rows of  data
  const tbody = d3.select("#preview tbody")
  const rows = tbody.selectAll("tr").data(filteredData.slice(0, 10)).enter().append("tr")
  rows
    .selectAll("td")
    .data((d) => Object.values(d))
    .enter()
    .append("td")
    .text((d) => d)

  // 2.3. Create the table header
  // const cols = Object.keys(filteredData[0])
  // // const tableHeader = d3.select("thead").append("tr")
  // const tableHeader = d3.select("#preview table thead").append("tr")
  // tableHeader
  //   .selectAll("th")
  //   .data(cols)
  //   .enter()
  //   .append("th")
  // .text((d) => d)

  // // 2.2. Select the table body
  // const tbody = d3.select("#preview tbody")

  // const rows = tbody.selectAll("tr").data(filteredData.slice(0, 10)).enter().append("tr")
  // rows
  //   .selectAll("td")
  //   .data((d) => Object.values(d))
  //   .enter()
  //   .append("td")
  //   .text((d) => d)

  // // 2.3. Create a row for each country
  // const rows = tbody.selectAll("tr").data(data).enter().append("tr")

  // // 2.4. Create a cell for each column
  // rows
  //   .selectAll("td")
  //   .data((d) => Object.values(d))
  //   .enter()
  //   .append("td")
  //   .text((d) => d)
}

// 3. Data Visualization

function scatterplot(dataset: typeof data) {
  // 3.0 group the data by country
  const groupedData = d3Array.group(dataset, (d) => d.Team)
  const aggregations = Object.entries(Object.fromEntries(groupedData)).map(
    ([country, items]: [string, typeof data]) => {
      return {
        country,
        medals: items.length,
        gold: items.filter((d) => d.Medal === "Gold").length,
        silver: items.filter((d) => d.Medal === "Silver").length,
        bronze: items.filter((d) => d.Medal === "Bronze").length,
        averageAge: d3Array.mean(items, (d) => d.Age),
        averageHeight: d3Array.mean(items, (d) => d.Height),
        averageWeight: d3Array.mean(items, (d) => d.Weight),
      }
    }
  )

  // 3.1 Sort the data by number of medals and take the top 20 countries
  // const sortedAggregations = d3Array.sort(aggregations, (a, b) => b.medals - a.medals).slice(0, 20)
  const sortedAggregations = d3Array.sort(aggregations, (a, b) => b.medals - a.medals).slice(0, 30)

  // console.log({ groupedData, aggregations, sortedAggregations })

  // const countries = [...new Set(Object.keys(sortedAggregations))]

  const margins = { left: 50, right: 50, top: 50, bottom: 50 }
  const dimensions = { height: 400, width: 600, margins }

  // 3.2. Create the SVG
  const svg = d3
    .select("#scatterplot")
    .append("svg")
    .attr("width", dimensions.width + margins.right + margins.left)
    .attr("height", dimensions.height + margins.top + margins.bottom)
  // .style("background-color", "lightgrey")

  // 3.3. Create the scales
  const maxMedals = d3Array.max(sortedAggregations, (d) => d.medals) ?? 100
  // const maxGold = d3Array.max(sortedAggregations, (d) => d.gold) ?? 1
  const maxAge = d3Array.max(sortedAggregations, (d) => d.averageAge) ?? 1
  const minAge = d3Array.min(sortedAggregations, (d) => d.averageAge) ?? 1
  // const xScale = d3
  //   .scaleBand()
  //   .domain(countries)
  //   .range([margins.left, dimensions.width - margins.left - margins.right])
  // const xScale = d3
  //   .scaleLinear()
  //   .domain([0, maxGold])
  //   .range([margins.left, dimensions.width - margins.left - margins.right])

  const xScale = d3
    .scaleLinear()
    // .domain([0, maxAge])
    .domain([minAge - 2, maxAge + 2])
    .range([margins.left, dimensions.width - margins.left - margins.right])
  const yScale = d3
    .scaleLinear()
    .domain([0, maxMedals])
    .range([dimensions.height + margins.top, margins.bottom])

  // 3.4. Create the axes
  const xAxis = d3.axisBottom(xScale)
  const yAxis = d3.axisLeft(yScale)

  // 3.5. Add the axes to the SVG
  svg
    .append("g")
    .attr("transform", `translate(0, ${dimensions.height + margins.top})`)
    .call(xAxis)
  svg
    .append("text")
    .attr("x", dimensions.width / 2 - margins.left - margins.right)
    .attr("y", dimensions.height + margins.top + 40)
    .text("Average Age")
  svg.append("g").attr("transform", `translate(${margins.left}, 0)`).call(yAxis)

  // 3.6. Add the data points to the SVG
  svg
    .selectAll("circle")
    .data(sortedAggregations)
    .enter()
    .append("circle")
    // .attr("cx", (d) => xScale(d.gold) ?? 0)
    .attr("cx", (d) => xScale(d.averageAge ?? 0) ?? 0)
    .attr("cy", (d) => yScale(d.medals))
    .attr("r", 3)
    .attr("fill", "red")

  const stuff = sortedAggregations.map((d) => ({
    x: xScale(d.averageAge ?? 0) ?? 0,
    y: yScale(d.medals),
    max: yScale(maxMedals),
    country: d.country,
  }))

  // console.log({ stuff })

  // 3.7. Add the labels to the SVG
  svg
    .selectAll("text")
    .data(sortedAggregations)
    .enter()
    .append("text")
    // .attr("x", 0)
    .attr("x", (d) => xScale(d.averageAge ?? 0) ?? 0)
    .attr("y", (d) => yScale(d.medals) - yScale(maxMedals))
    // .attr("transform", (d) => `translate(${margins.left + xScale(d.averageAge ?? 0) ?? 0}, ${yScale(d.medals)})`)
    // .attr("transform", (d) => `translate(${margins.left + xScale(d.averageAge ?? 0) ?? 0}, 0)`)
    // .attr("x", (d) => xScale(d.gold) ?? 0)
    // .attr("x", (d) => xScale(d.averageAge ?? 0) ?? 0)
    // .attr("y", (d) => yScale(d.medals))
    // .attr("y", (d) => d.medals)
    .text((d) => d.country)
    .attr("vertical-align", "middle")
    .attr("text-anchor", "start")

  // 3.1. Get the width and height of the SVG
  // const width = 600
  // const height = 400

  // // 3.2. Create the SVG
  // const svg = d3
  //   .select("#scatterplot")
  //   .append("svg")
  //   .attr("width", width)
  //   .attr("height", height)

  // // 3.3. Create the scales
  // const xScale = d3
  //   .scaleLinear()
  //   .domain(d3Array.extent(dataset, (d) => d.Height ?? 0))
  //   .range([0, width])
  // const yScale = d3
  //   .scaleLinear()
  //   .domain(d3Array.extent(dataset, (d) => d.Weight))
  //   .range([height, 0])

  // // 3.4. Create the axes
  // const xAxis = d3.axisBottom(xScale)
  // const yAxis = d3.axisLeft(yScale)

  // // 3.5. Add the axes to the SVG
  // svg
  //   .append("g")
  //   .attr("transform", `translate(0, ${height})`)
  //   .call(xAxis)
  // svg.append("g").call(yAxis)

  // // 3.6. Add the data points to the SVG
  // svg
  //   .selectAll("circle")
  //   .data(dataset)
  //   .enter()
  //   .append("circle")
  //   .attr("cx", (d) => xScale(d.Height))
  //   .attr("cy", (d) => yScale(d.Weight))
  //   .attr("r", 3)
  //   .attr("fill", "red")
}

// scatterplot(data)

function barplot(dataset: typeof data) {
  // 3.0 group the data by country
  const groupedData = d3Array.group(dataset, (d) => d.Team)
  const aggregations = Object.entries(Object.fromEntries(groupedData)).map(
    ([country, items]: [string, typeof data]) => {
      return {
        country,
        abbrev: items[0].NOC,
        medals: items.length,
        gold: items.filter((d) => d.Medal === "Gold").length,
        silver: items.filter((d) => d.Medal === "Silver").length,
        bronze: items.filter((d) => d.Medal === "Bronze").length,
        averageAge: d3Array.mean(items, (d) => d.Age),
        averageHeight: d3Array.mean(items, (d) => d.Height),
        averageWeight: d3Array.mean(items, (d) => d.Weight),
      }
    }
  )

  // 3.1 Sort the data by number of medals and take the top 20 countries
  // const sortedAggregations = d3Array.sort(aggregations, (a, b) => b.medals - a.medals).slice(0, 20)
  // const sortedAggregations = d3Array.sort(aggregations, (a, b) => b.medals - a.medals).slice(0, 30)
  const sortedAggregations = d3Array.sort(aggregations, (a, b) => b.medals - a.medals).slice(0, 10)

  const margins = { left: 50, right: 50, top: 50, bottom: 50 }
  const dimensions = { height: 400, width: 600, margins }

  // 3.2. Create the SVG
  const svg = d3
    .select("#barplot")
    .append("svg")
    .attr("width", dimensions.width + margins.right + margins.left)
    .attr("height", dimensions.height + margins.top + margins.bottom)
  // .style("background-color", "lightgrey")

  // 3.3. Create the scales
  const maxMedals = d3Array.max(sortedAggregations, (d) => d.medals) ?? 100
  // const maxGold = d3Array.max(sortedAggregations, (d) => d.gold) ?? 1
  // const xScale = d3
  //   .scaleBand()
  //   .domain(Object.keys(sortedAggregations))
  //   .range([margins.left, dimensions.width - margins.left - margins.right])

  // const xScale = d3
  //   .scaleLinear()
  //   .domain([0, maxGold])
  //   .range([margins.left, dimensions.width - margins.left - margins.right])

  // const xScale = d3
  //   .scaleLinear()
  //   // .domain([0, maxAge])
  //   .domain([minAge - 2, maxAge + 2])
  //   .range([margins.left, dimensions.width - margins.left - margins.right])

  const countries = Object.keys(sortedAggregations)
  const xScale = d3
    .scaleLinear()
    .domain([0, countries.length])
    .range([margins.left, dimensions.width - margins.left - margins.right])

  const yScale = d3
    .scaleLinear()
    .domain([0, maxMedals])
    .range([dimensions.height + margins.top, margins.bottom])

  // 3.4. Create the axes
  const xAxis = d3.axisBottom(xScale).ticks(0)
  const yAxis = d3.axisLeft(yScale)

  const barColors = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5", "--chart-6"]

  // Filter
  const filter = svg
    .append("svg:defs")
    .append("svg:filter")
    .attr("id", "blurFilter1")
    .append("svg:feGaussianBlur")
    .attr("stdDeviation", 4)

  // 3.5. Add the axes to the SVG
  svg
    .append("g")
    .attr("transform", `translate(0, ${dimensions.height + margins.top})`)
    .call(xAxis)
  // svg
  //   .append("text")
  //   .attr("x", dimensions.width / 2 - margins.left - margins.right)
  //   .attr("y", dimensions.height + margins.top + 40)
  //   .text("Average Age")
  svg.append("g").attr("transform", `translate(${margins.left}, 0)`).call(yAxis)

  // 3.6. Add the data points to the SVG
  const groups = svg
    .selectAll("g")
    .data(sortedAggregations)
    .enter()
    .append("g")
    // .attr("cx", (d) => xScale(d.averageAge ?? 0) ?? 0)
    // .attr("x", (d, i) => xScale(i))
    // .attr("y", (d) => yScale(d.medals))
    .attr("transform", (d, i) => `translate(${xScale(i)}, ${yScale(d.medals)})`)

  const rects = svg
    .selectAll("rect")
    .data(sortedAggregations)
    .enter()
    .append("rect")
    // .attr("cx", (d) => xScale(d.gold) ?? 0)
    // .attr("cx", (d) => xScale(d.averageAge ?? 0) ?? 0)
    .attr("x", (d, i) => xScale(i) + 2)
    .attr("y", (d) => yScale(d.medals))
    // .attr("width", xScale(0) ?? 10)
    // .attr("x", 0)
    // .attr("y", 0)
    .attr("width", xScale(0) - 10)
    .attr("height", (d) => dimensions.height + margins.top - yScale(d.medals))
    // .attr("fill", "red")
    .attr("fill", function (d, i) {
      return `var(${barColors[i % barColors.length]})`
    })
    .on("mouseenter", function () {
      d3.select(this).attr("filter", "url(#blurFilter1)").attr("opacity", "0.5")
    })
    .on("mouseout", function () {
      d3.select(this).attr("filter", null).attr("opacity", null)
    })

  const rectLabelsGroup = svg.append("g").attr("transform", `translate(0, 0)`)

  const rectLabels = rectLabelsGroup
    .selectAll("text")
    .data(sortedAggregations)
    .enter()
    .append("text")
    .attr("x", (d, i) => xScale(i) + 2)
    .attr("y", (d) => yScale(d.medals))
    .attr("dx", 5)
    .attr("dy", -5)
    .text((d) => d.abbrev)
    .attr("fill", "white")
    .attr("font-size", 16)

  const rectValueLabelsGroup = svg.append("g").attr("transform", `translate(0, 0)`)
  const rectValueLabels = rectValueLabelsGroup
    .selectAll("text")
    .data(sortedAggregations)
    .enter()
    .append("text")
    .attr("x", (d, i) => xScale(i))
    .attr("y", (d) => yScale(d.medals))
    .attr("dx", 9)
    .attr("dy", 25)
    .text((d) => d.medals)
    .attr("fill", "black")
    .attr("font-size", 15)

  // .append("text")
  // .attr("x", (d, i) => xScale(i))
  // // .attr("y", (d) => yScale(maxMedals) - yScale(d.medals))
  // .attr("y", (d) => 100)
  // // .attr("dx", xScale(0) / 2)
  // // .attr("dy", -5)
  // .text((d) => d.abbrev)
  // .attr("text-anchor", "start")

  // .append("rect")
  // // .attr("cx", (d) => xScale(d.gold) ?? 0)
  // // .attr("cx", (d) => xScale(d.averageAge ?? 0) ?? 0)
  // .attr("x", (d, i) => xScale(i))
  // .attr("y", (d) => yScale(d.medals))
  // // .attr("width", xScale(0) ?? 10)
  // .attr("width", xScale(0))
  // .attr("height", (d) => dimensions.height + margins.top - yScale(d.medals))
  // // .attr("fill", "red")
  // .attr("fill", function (d, i) {
  //   return `var(${barColors[i % barColors.length]})`
  // })
  // .on("mouseenter", function () {
  //   d3.select(this).attr("filter", "url(#blurFilter1)").attr("opacity", "0.5")
  // })
  // .on("mouseout", function () {
  //   d3.select(this).attr("filter", null).attr("opacity", null)
  // })
  // .append("text")
  // .attr("x", (d, i) => xScale(i))
  // // .attr("y", (d) => yScale(maxMedals) - yScale(d.medals))
  // .attr("y", (d) => 100)
  // // .attr("dx", xScale(0) / 2)
  // // .attr("dy", -5)
  // .text((d) => d.abbrev)
  // .attr("text-anchor", "start")

  // svg
  //   .selectAll("text")
  //   .data(sortedAggregations)
  //   .enter()
  //   .append("text")
  //   .attr("x", (d, i) => xScale(i))
  //   // .attr("y", (d) => yScale(maxMedals) - yScale(d.medals))
  //   .attr("y", (d) => 100)
  //   // .attr("dx", xScale(0) / 2)
  //   // .attr("dy", -5)
  //   .text((d) => d.abbrev)

  // const stuff = sortedAggregations.map((d) => ({
  //   x: xScale(d.averageAge ?? 0) ?? 0,
  //   y: yScale(d.medals),
  //   max: yScale(maxMedals),
  //   country: d.country,
  // }))

  // console.log({ stuff })

  // 3.7. Add the labels to the SVG
  // svg
  //   .selectAll("text")
  //   .data(sortedAggregations)
  //   .enter()
  //   .append("text")
  //   .attr("x", (d) => xScale(d.averageAge ?? 0) ?? 0)
  //   .attr("y", (d) => yScale(d.medals) - yScale(maxMedals))
  //   .text((d) => d.country)
  //   .attr("vertical-align", "middle")
  //   .attr("text-anchor", "start")
}

// barplot(data)

function displayDataVisualization() {
  // 3.1. Get the data for the most recent olympics
  const maxYear = d3Array.max(data, (d) => d.Year)
  const filteredData = data.filter((d) => d.Year === maxYear)

  // 3.2. Group the data by country
  const groupedData = d3Array.group(filteredData, (d) => d.Team)

  // 3.3. Sum the number of medals per country
  const summedData = Object.entries(groupedData).map(([key, value]) => {
    return {
      country: key,
      medals: value.length,
    }
  })

  // 3.4. Sort the data by number of medals
  const sortedData = summedData.sort((a, b) => b.medals - a.medals)

  // 3.5. Select the svg
  const svg = d3.select("#chart svg")

  // 3.6. Create the scales
  const xScale = d3
    .scaleBand()
    .domain(sortedData.map((d) => d.country))
    .range([0, 500])
    .padding(0.1)
  const yScale = d3
    .scaleLinear()
    .domain([0, d3Array.max(sortedData, (d) => d.medals)])
    .range([0, 500])

  // 3.7. Create the bars
  const bars = svg.selectAll("rect").data(sortedData).enter().append("rect")
  bars
    // @ts-ignore
    .attr("x", (d) => xScale(d.country))
    .attr("y", (d) => 500 - yScale(d.medals))
    .attr("width", xScale.bandwidth())
    .attr("height", (d) => yScale(d.medals))
    .attr("fill", "blue")
}

window.onload = function () {
  barplot(data)
  // displayDataVisualization()
}

// displayDataVisualization()

// 4. Interactive Data Visualization

// 5. Data Visualization with D3

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
