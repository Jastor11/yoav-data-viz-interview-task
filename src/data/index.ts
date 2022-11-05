import data from "./winter_olympics.json"

type DataEntry = {
  ID: number
  Name: string
  Gender: "M" | "F"
  Age: number
  Height: number
  Weight: number
  Team: string
  NOC: string
  Games: string
  Year: number
  Season: "Winter" | "Summer"
  City: string
  Sport: string
  Event: string
  Medal: "Bronze" | "Silver" | "Gold"
}

export default data as DataEntry[]
