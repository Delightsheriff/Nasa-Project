const { parse } = require("csv-parse");
const fs = require("fs");
const { get } = require("http");
const path = require("path");
const Planet = require("./planets.mongo");

function isHabitablePlanet(planet) {
  return (
    planet["koi_disposition"] === "CONFIRMED" &&
    planet["koi_insol"] > 0.36 &&
    planet["koi_insol"] < 1.11 &&
    planet["koi_prad"] < 1.6
  );
}

function loadPlanetsData() {
  return new Promise((resolve, reject) =>
    fs
      .createReadStream(
        path.join(__dirname, "..", "..", "data", "kepler-data.csv")
      )
      .pipe(
        parse({
          comment: "#",
          columns: true,
        })
      )
      .on("data", async (data) => {
        if (isHabitablePlanet(data)) {
          // TODO: Replace below create with insert + update = upsert
          // await Planet.create({
          //   keplerName: data.kepler_name,
          // });
          savePlanet(data);
        }
      })
      .on("error", (err) => {
        console.log(err);
        reject(err);
      })
      .on("end", async () => {
        const countPlanetsFound = (await getAllPlanets()).length;
        console.log(`${countPlanetsFound} habitable planets found!`);
        resolve();
      })
  );
}

async function getAllPlanets() {
  return await Planet.find({}, { _id: 0, __v: 0 }); //retruturns all planets except _id and __v
}
async function savePlanet(planet) {
  try {
    await Planet.updateOne(
      { keplerName: planet.kepler_name },
      { keplerName: planet.kepler_name },
      { upsert: true }
    );
  } catch (error) {
    console.error(`Could not save planet ${error}`);
  }
}

module.exports = {
  getAllPlanets,
  loadPlanetsData,
};
