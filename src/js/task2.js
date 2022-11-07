import data from "../data"
import * as d3 from "d3"
import * as d3Array from "d3-array"

function scatterplot(dataset) {
  // 3.0 group the data by country
  const groupedData = d3Array.group(dataset, (d) => d.Team)
  const aggregations = Object.entries(Object.fromEntries(groupedData)).map(([country, items]) => {
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
  })

  // 3.1 Sort the data by number of medals and take the top 20 countries
  const sortedAggregations = d3Array.sort(aggregations, (a, b) => b.medals - a.medals).slice(0, 30)

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

  // 3.7. Add the labels to the SVG
  svg
    .selectAll("text")
    .data(sortedAggregations)
    .enter()
    .append("text")
    .attr("x", (d) => xScale(d.averageAge ?? 0) ?? 0)
    .attr("y", (d) => yScale(d.medals) - yScale(maxMedals))
    .text((d) => d.country)
    .attr("vertical-align", "middle")
    .attr("text-anchor", "start")
}

function barplot(dataset) {
  // 3.0 group the data by country
  const groupedData = d3Array.group(dataset, (d) => d.Team)
  const aggregations = Object.entries(Object.fromEntries(groupedData)).map(([country, items]) => {
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
  })

  // 3.1 Sort the data by number of medals and take the top 20 countries
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
  svg.append("g").attr("transform", `translate(${margins.left}, 0)`).call(yAxis)

  // 3.6. Add the data points to the SVG
  const groups = svg
    .selectAll("g")
    .data(sortedAggregations)
    .enter()
    .append("g")
    .attr("transform", (d, i) => `translate(${xScale(i)}, ${yScale(d.medals)})`)

  const rects = svg
    .selectAll("rect")
    .data(sortedAggregations)
    .enter()
    .append("rect")
    .attr("x", (d, i) => xScale(i) + 2)
    .attr("y", (d) => yScale(d.medals))
    .attr("width", xScale(0) - 10)
    .attr("height", (d) => dimensions.height + margins.top - yScale(d.medals))
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
}

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
    .attr("x", (d) => xScale(d.country))
    .attr("y", (d) => 500 - yScale(d.medals))
    .attr("width", xScale.bandwidth())
    .attr("height", (d) => yScale(d.medals))
    .attr("fill", "blue")
}

window.onload = function () {
  barplot(data)
}
