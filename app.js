const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const express = require("express");
const app = express();
app.use(express.json());
module.exports = app;

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB error : ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

app.get("/states/", async (request, response) => {
  const listOfStatesQuery = `
        SELECT 
        state_id AS stateId ,
        state_name AS stateName ,
        population
        FROM state ; `;
  const listOfStates = await db.all(listOfStatesQuery);
  response.send(listOfStates);
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateQuery = `
        SELECT 
        state_id AS stateId ,
        state_name AS stateName ,
        population
        FROM state 
        WHERE state_id = ${stateId}; `;
  const state = await db.get(stateQuery);
  response.send(state);
});

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const addDistrictQuery = `
    INSERT INTO 
    district (district_name,state_id,cases,cured,active,deaths)
    VALUES(
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    ) ;`;
  const dbResponse = await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT 
        district_id AS districtId ,
        district_name AS districtName ,
        state_id AS stateId ,
        cases ,
        cured ,
        active ,
        deaths
        FROM district 
        WHERE district_id = ${districtId}; `;
  const getDistrict = await db.get(getDistrictQuery);
  response.send(getDistrict);
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM 
    district
    WHERE district_id = ${districtId} ;`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const updateDistrictQuery = `
        UPDATE district 
        SET 
            district_name = '${districtName}' ,
            state_id = ${stateId} ,
            cases = ${cases} ,
            cured = ${cured} ,
            active = ${active} ,
            deaths = ${deaths}
        WHERE district_id = ${districtId} ; `;

  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const totalStatsOfStateQuery = `
    SELECT 
    SUM(cases) AS totalCases ,
    SUM(cured) AS totalCured ,
    SUM(active) AS totalActive,
    SUM(deaths) AS totalDeaths 
    FROM district 
    GROUP BY state_id
    Having state_id = ${stateId} ;`;
  const totalStatsOfState = await db.get(totalStatsOfStateQuery);
  response.send(totalStatsOfState);
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateOfGivenDistrictIdQuery = `
    SELECT 
    state_name AS stateName 
    FROM (state INNER JOIN district ON state.state_id = district.state_id)
    WHERE district.district_id = ${districtId} ;
    `;
  const stateOfGivenDistrictId = await db.get(stateOfGivenDistrictIdQuery);
  response.send(stateOfGivenDistrictId);
});
