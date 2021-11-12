import axios from "axios";
import UserAgent from "user-agents";
import * as cheerio from "cheerio";
import cliProgress from "cli-progress";
//import tedious from "tedious";

/*
    Read Me:
    
    When root is mentioned, this is describing the job list when browsing indeed.com searching for
    software engineering jobs in New York, NY. Therefore, root contains all the skills that job descriptions mention.
    When branch is described, branch is all the sub catagories that are explored, like location, companies, 

    Written by : Ilya Shvabskiy
*/

//-------------------------------------Classes--------------------------------------------------------------------

// Contains the full dataframe, root values, and all children values for every listing generated by exploring the skill list.(root)
class jobsSnapshot {
  root: techRoot;
  data: techBranch[];
  date: string;

  constructor() {
    this.root = new techRoot();
    this.data = new Array<techBranch>();
    this.date = Date();
  }
}

// Designed to store all the subcatagories when exploring the listings generated by exploring root. (skills list).
class techBranch {
  name: string;
  remote: Map<string, number>;
  salaryEst: Map<string, number>;
  jobType: Map<string, number>;
  expLevel: Map<string, number>;
  eduLevel: Map<string, number>;
  location: Map<string, number>;
  company: Map<string, number>;

  constructor() {
    this.name = " ";
    this.remote = new Map<string, number>([]);
    this.salaryEst = new Map<string, number>([]);
    this.jobType = new Map<string, number>([]);
    this.eduLevel = new Map<string, number>([]);
    this.location = new Map<string, number>([]);
    this.company = new Map<string, number>([]);
    this.expLevel = new Map<string, number>([]);
  }
}

// Designed to store all the information at the root (all the technologies and the amount of jobs listed for them).
class techRoot {
  jobs: number;
  skills: Map<string, number>;
  remote: Map<string, number>;
  salaryEst: Map<string, number>;
  jobType: Map<string, number>;
  eduLevel: Map<string, number>;
  location: Map<string, number>;
  company: Map<string, number>;
  expLevel: Map<string, number>;

  constructor() {
    this.jobs = 0;
    this.skills = new Map<string, number>([]);
    this.remote = new Map<string, number>([]);
    this.salaryEst = new Map<string, number>([]);
    this.jobType = new Map<string, number>([]);
    this.eduLevel = new Map<string, number>([]);
    this.location = new Map<string, number>([]);
    this.company = new Map<string, number>([]);
    this.expLevel = new Map<string, number>([]);
  }
}

//---------------------------------------Data & Configs------------------------------------------------------------------

// Store element directory for selector.
const filterMap = new Map([
  ["Remote", "ul#filter-remotejob-menu li a"],
  ["Salary Estimate", "ul#filter-salary-estimate-menu li a"],
  ["Job Type", "ul#filter-jobtype-menu li a"],
  ["Education Level", "ul#filter-taxo2-menu li a"],
  ["Location", "ul#filter-loc-menu li a"],
  ["Company", "ul#filter-cmp-menu li a"],
  ["Experiance Level", "ul#filter-explvl-menu li a"],
]);

// Stores urls that point to states of indeed.com, from which information can be extracted in the context of the key.
// Root defines the state from which the availible braches that can be explored are defined.
const urlMap = new Map([
  [
    "Java",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=1X7zAik_RAWPuMD_To60Sg",
  ],
  [
    "JavaScript",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=oJHjzJOuQkapHAUg0sf0-Q",
  ],
  [
    "Python",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=8GQeqOBVSO2eVhu55t0BMg",
  ],
  [
    "React",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=G7qnOX5fQrO_ThMhs1Luog",
  ],
  [
    "SQL",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=7stX-DmtS16eXxyIuIY47w",
  ],
  [
    "C++",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=Lj6PoGz2TaiI2iH954e2zA",
  ],
  [
    "HTML5",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=-gc_omGyRMS9UCrrnSwVPw",
  ],
  [
    "CSS",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=_Qk_PWgPQYWIpMowI17j4w",
  ],
  [
    "C#",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=6pwSVqu1S7SQobeP4fIE7Q",
  ],
  [
    "Angular",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=mZpfmuT0QhuFmpBK7P1wfw",
  ],
  [
    "Spring",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=oCW289VYSPuu8hJ9uqavkg",
  ],
  [
    "TypeScript",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=t1DKhTO0TyyLxNVZEJ--_A",
  ],
  [
    "Go",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=vzoW1JNZSlOy6qIAa-Rg1Q",
  ],
  [
    "C",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=GhDKjk0ET-yGCfhGCXe2xw",
  ],
  [
    "Scala",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=jRHc7cg4SJWo_LN7IVQe7Q",
  ],
  [
    "Ruby",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=XCvkqQa7TlSdWf6ITX92wg",
  ],
  [
    "Kotlin",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=1jpXv4ILT36QBa3NwGYJMQ",
  ],
  [
    "jQuery",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=75x1tOK-TU-o6UrdLZKQ2g",
  ],
  [
    "PHP",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=BCst9M2uRaWCZBrRYzzxiA",
  ],
  [
    "Swift",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=xOmldu5eQG6MdkbbbFsioQ",
  ],
  [
    "Vue.js",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=6XqX17W5QpGC7xpLTI3RKQ",
  ],
  [
    "Django",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=7xrzbOWDSAe5iKmQauYUEQ",
  ],
  [
    "ASP.NET",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=ihT1Nd_DQQaXzGwlMHagvw",
  ],
  [
    "Perl",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=bjBQODjORfy4rlSgrph1wA",
  ],
  [
    "PowerShell",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=MF7dYUIqT_in6p8ZLP65lg",
  ],
  [
    "Flask",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=ObsCS90cTva3XMIquNwWcg",
  ],
  [
    "Objective-C",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=tCAy5fPxSwGGTYL_V5DXFw",
  ],
  [
    "R",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=350MohsxRF6IxtbyzJtK0g",
  ],
  [
    "Rust",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=2mJmUe2xTPapZIQntEwuvw",
  ],
  [
    "Drupal",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=9qY-5QknS1aR0qdQ523m3A",
  ],
  [
    "Laravel",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=fFJEWAtXQhmS25g87x1DTw",
  ],
  [
    "Express.js",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=_edoXbLxRDGDrANwBIJEEQ",
  ],
  [
    "Haskell",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=r-d9HkoUQ_W4WhwrDQb-2w",
  ],
  [
    "Assembly",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=cmU4ng_1S4SEBlqZ1FsIvw",
  ],
  [
    "Gatsby",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=Zg84cjF5TKSn2xwoIioIvQ",
  ],
  [
    "Dart",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=ymVq76R5SJGdPCL008kQ_w",
  ],
  [
    "Julia",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=rXykeRNbS5G52slBGUtLoQ",
  ],
  [
    "XML",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=VpXF4_6oQl-wM_lyoIoydQ",
  ],
  [
    ".NET",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=VWPkWxlYSM6iIiCPhqolsg",
  ],
  [
    ".NET Core",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=Tu1Yc7WeQAaD9XjRgp74SA",
  ],
  [
    "Node.js",
    "https://www.indeed.com/jobs?q=Software+Engineer&l=New+York,+NY&taxo1=V4iFcJgUTK-R9MhOLH41Bw",
  ],
]);

// Database connection configuration.
/*const dbConfig = {
  server: "your_server.database.windows.net", //update me
  authentication: {
    type: "default",
    options: {
      userName: "your_username", //update me
      password: "your_password", //update me
    },
  },
  options: {
    // If you are on Microsoft Azure, you need encryption:
    encrypt: true,
    database: "your_database", //update me
  },
};*/

// Creates Axios client, timeout set to 10 seconds.
const client = new axios.Axios({
  timeout: 10000,
});

// Creates Database Client.
//const Connection = tedious.Connection;

// User agent passed into headers to prevent scraper detection.
const userAgent = new UserAgent();

//-----------------------------------------Utilities---------------------------------------------------------------

// Works like a sleep function. Uses await logic.
const delay = ms => new Promise(res => setTimeout(res, ms));

// Utility to generate a random number in specified range.
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.rect);
//----------------------------------Main Functionality-----------------------------------------------------------------------

// Axios request, then cheerio parses, stores into a map.
const pullRootListings = async (): Promise<Map<string, number>> => {
  try {
    const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.rect);
    bar1.start(10, 0);
    const result = new techRoot();
    while (result.skills.size <= 39) {
      // Use axios client to make request.
      const { data } = await client.request({
        withCredentials: true,
        method: "GET",
        url: "https://www.indeed.com/jobs?q=Software%20Engineer&l=New%20York%2C%20NY&vjk=94aeb151c39b9108",
        headers: {
          "user-agent": userAgent.toString(),
        },
      });

      if (data) {
        bar1.increment();
        const $ = cheerio.load(data);

        const tempStore2 = new Map<string, number>([]);
        $("ul#filter-taxo1-menu li a").each((_, e) => {
          const myValue = $(e).text();
          // Due to the format of the data, it we split at the space and, cut off the () from either side the value.
          const tempString = myValue.split(" ");
          tempString[1] = tempString[1].slice(1, -1);
          tempStore2.set(tempString[0], parseInt(tempString[1]));
        });
        comparator(result.skills, tempStore2);

        let tempNum = 0;
        $("div#searchCountPages").each((_, e) => {
          const myValue = $(e).text();
          // Due to the format of the data, it we split at the space and, cut off the () from either side the value.
          const tempString = myValue.trimStart().split(" ");
          tempNum = parseInt(tempString[3].replace(",", ""));
        });

        if (tempNum > result.jobs) {
          result.jobs = tempNum;
        }

        for (const filter of filterMap.keys()) {
          switch (filter) {
            case "Remote": {
              const tempStore = new Map<string, number>();
              $(filterMap.get(filter)).each((_, e) => {
                const myValue = $(e).text();
                const tempString = myValue.split(" (");
                if (tempString.length > 2) {
                  tempString[2] = tempString[2].slice(0, -1);
                  tempStore.set(tempString[0], parseInt(tempString[2]));
                } else {
                  tempString[1] = tempString[1].slice(0, -1);
                  tempStore.set(tempString[0], parseInt(tempString[1]));
                }
                comparator(result.remote, tempStore);
              });
              break;
            }
            case "Salary Estimate": {
              const tempStore = new Map<string, number>();
              $(filterMap.get(filter)).each((_, e) => {
                const myValue = $(e).text();
                const tempString = myValue.split(" (");
                tempString[1] = tempString[1].slice(0, -1);
                tempStore.set(tempString[0], parseInt(tempString[1]));
                comparator(result.salaryEst, tempStore);
              });
              break;
            }
            case "Job Type": {
              const tempStore = new Map<string, number>();
              $(filterMap.get(filter)).each((_, e) => {
                const myValue = $(e).text();
                const tempString = myValue.split(" (");
                tempString[1] = tempString[1].slice(0, -1);
                tempStore.set(tempString[0], parseInt(tempString[1]));
                comparator(result.jobType, tempStore);
              });
              break;
            }
            case "Education Level": {
              const tempStore = new Map<string, number>();
              $(filterMap.get(filter)).each((_, e) => {
                const myValue = $(e).text();
                const tempString = myValue.split(" (");
                tempString[1] = tempString[1].slice(0, -1);
                tempStore.set(tempString[0], parseInt(tempString[1]));
                comparator(result.eduLevel, tempStore);
              });
              break;
            }
            case "Location": {
              const tempStore = new Map<string, number>();
              $(filterMap.get(filter)).each((_, e) => {
                const myValue = $(e).text();
                const tempString = myValue.split(" (");
                tempString[1] = tempString[1].slice(0, -1);
                tempStore.set(tempString[0], parseInt(tempString[1]));
                comparator(result.location, tempStore);
              });
              break;
            }
            case "Company": {
              const tempStore = new Map<string, number>();
              $(filterMap.get(filter)).each((_, e) => {
                const myValue = $(e).text();
                const tempString = myValue.split(" (");
                tempString[1] = tempString[1].slice(0, -1);
                tempStore.set(tempString[0], parseInt(tempString[1]));
                comparator(result.company, tempStore);
              });
              break;
            }
            case "Experiance Level": {
              const tempStore = new Map<string, number>();
              $(filterMap.get(filter)).each((_, e) => {
                const myValue = $(e).text();
                const tempString = myValue.split(" (");
                tempString[1] = tempString[1].slice(0, -1);
                tempStore.set(tempString[0], parseInt(tempString[1]));
                comparator(result.expLevel, tempStore);
              });
              break;
            }
            default:
              console.log("Something went terribly wrong. Please investigate");
              break;
          }
        }
        if (result.skills.size == 0) throw "Bad Request Try Again";
        await delay(getRandomInt(30000, 60000));
      }
    }
    bar1.stop;
    console.log(result);
    return result.skills;
  } catch (e) {
    console.log(e);
    return new Map<string, number>([]);
  }
};

// Runs after root completes so that we know which children must be requested.
const pullChildrenListings = async (input: Map<string, number>): Promise<Array<techBranch>> => {
  try {
    const result = new Array<techBranch>();
    // Passes in root map of keys.
    for (const skill of input.keys()) {
      console.log("Working...");
      // Checks if the key exists in the url map. Then passes in the url for the according skill.
      if (urlMap.has(skill)) {
        const listings = new techBranch();
        for (let i = 0; i < 3; i++) {
          const { data } = await client.request({
            withCredentials: true,
            method: "GET",
            url: urlMap.get(skill),
            headers: {
              "user-agent": userAgent.toString(),
            },
          });

          // If the data is valid..
          if (data) {
            // For every differant filter, iterate through each sub catagory and record results to the respective branch.
            listings.name = skill;
            const $ = cheerio.load(data);
            for (const filter of filterMap.keys()) {
              switch (filter) {
                case "Remote": {
                  const tempStore = new Map<string, number>();
                  $(filterMap.get(filter)).each((_, e) => {
                    const myValue = $(e).text();
                    const tempString = myValue.split(" (");
                    if (tempString.length > 2) {
                      tempString[2] = tempString[2].slice(0, -1);
                      tempStore.set(tempString[0], parseInt(tempString[2]));
                    } else {
                      tempString[1] = tempString[1].slice(0, -1);
                      tempStore.set(tempString[0], parseInt(tempString[1]));
                    }
                    comparator(listings.remote, tempStore);
                  });
                  break;
                }
                case "Salary Estimate": {
                  const tempStore = new Map<string, number>();
                  $(filterMap.get(filter)).each((_, e) => {
                    const myValue = $(e).text();
                    const tempString = myValue.split(" (");
                    tempString[1] = tempString[1].slice(0, -1);
                    tempStore.set(tempString[0], parseInt(tempString[1]));
                    comparator(listings.salaryEst, tempStore);
                  });
                  break;
                }
                case "Job Type": {
                  const tempStore = new Map<string, number>();
                  $(filterMap.get(filter)).each((_, e) => {
                    const myValue = $(e).text();
                    const tempString = myValue.split(" (");
                    tempString[1] = tempString[1].slice(0, -1);
                    tempStore.set(tempString[0], parseInt(tempString[1]));
                    comparator(listings.jobType, tempStore);
                  });
                  break;
                }
                case "Education Level": {
                  const tempStore = new Map<string, number>();
                  $(filterMap.get(filter)).each((_, e) => {
                    const myValue = $(e).text();
                    const tempString = myValue.split(" (");
                    tempString[1] = tempString[1].slice(0, -1);
                    tempStore.set(tempString[0], parseInt(tempString[1]));
                    comparator(listings.eduLevel, tempStore);
                  });
                  break;
                }
                case "Location": {
                  const tempStore = new Map<string, number>();
                  $(filterMap.get(filter)).each((_, e) => {
                    const myValue = $(e).text();
                    const tempString = myValue.split(" (");
                    tempString[1] = tempString[1].slice(0, -1);
                    tempStore.set(tempString[0], parseInt(tempString[1]));
                    comparator(listings.location, tempStore);
                  });
                  break;
                }
                case "Company": {
                  const tempStore = new Map<string, number>();
                  $(filterMap.get(filter)).each((_, e) => {
                    const myValue = $(e).text();
                    const tempString = myValue.split(" (");
                    tempString[1] = tempString[1].slice(0, -1);
                    tempStore.set(tempString[0], parseInt(tempString[1]));
                    comparator(listings.company, tempStore);
                  });
                  break;
                }
                case "Experiance Level": {
                  const tempStore = new Map<string, number>();
                  $(filterMap.get(filter)).each((_, e) => {
                    const myValue = $(e).text();
                    const tempString = myValue.split(" (");
                    tempString[1] = tempString[1].slice(0, -1);
                    tempStore.set(tempString[0], parseInt(tempString[1]));
                    comparator(listings.expLevel, tempStore);
                  });
                  break;
                }
                default:
                  console.log("Something went terribly wrong. Please investigate");
                  break;
              }
            }
          }
          await delay(getRandomInt(30000, 60000));
        }
        result.push(listings);
      }
    }
    bar1.stop;
    return result;
  } catch (e) {
    console.log(e);
    console.log("You shouldn't see me unless something is very broken");
    return new Array<techBranch>();
  }
};

// Takes in two maps, and stores max values of all inputs into final.
const comparator = (final: Map<string, number>, temp: Map<string, number>) => {
  for (const key of temp.keys()) {
    if (isNaN(temp.get(key))) continue;
    else {
      if (final.has(key)) {
        if (final.get(key) == temp.get(key)) continue;
        else if (final.get(key) < temp.get(key)) final.set(key, temp.get(key));
        else continue;
      } else final.set(key, temp.get(key));
    }
  }
};

// Utilizes pullListings to fetch values, and comparator to store maximums of each value, by 10 attempts.
// This amount of attempts is not verified to be successful every time so we will attempt to re run the loop if its unsuccessful.
//------------------------------------------Main Thread-------------------------------------------------------------
const snapshot = new jobsSnapshot();
const roots = new techRoot();

pullRootListings()
  .then(a => {
    console.log("Finished");
    pullChildrenListings(a).then(ree => {
      snapshot.data = ree;
      console.log(ree);
    });
  })
  .catch(console.log);
/*const dbConnection = new Connection(dbConfig);
dbConnection.on("connect", function (err) {
  // If no error, then good to proceed.
  console.log("Connected");
});

dbConnection.connect();
*/
