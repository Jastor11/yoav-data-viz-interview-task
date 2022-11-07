import data from "../data"
import * as d3 from "d3"
import * as d3Array from "d3-array"

function processData() {
  const groupedData = d3Array.group(data, (d) => d.Team)

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
}

window.onload = function () {
  processData()
  displayDataPreview()
}
