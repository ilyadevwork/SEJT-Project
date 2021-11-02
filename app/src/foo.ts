import axios from "axios";
import UserAgent from "user-agents";
import * as cheerio from "cheerio";
import "url";

// Creates client, timeout set to 10 seconds.
const client = new axios.Axios({
  timeout: 10000,
});

const userAgent = new UserAgent();

// Utility to generate a random number in specified range.
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

// Works like a sleep function. Uses await logic.
const delay = ms => new Promise(res => setTimeout(res, ms));

// Store element directory for selector.
const filterMap = new Map([
  ["Root", "ul#filter-taxo1-menu li a"],
  ["Remote", "ul#filter-remotejob-menu li a"],
  ["Salary Estimate", "ul#filter-salary-estimate-menu li a"],
  ["Job Type", "ul#filter-jobtype-menu li a"],
  ["Education Level", "ul#filter-taxo2-menu li a"],
  ["Clearance Type", "ul#filter-taxo3-menu li a"],
  ["Location", "ul#filter-loc-menu li a"],
  ["Company", "ul#filter-cmp-menu li a"],
  ["Experiance Level", "ul#filter-explvl-menu li a"],
]);

// Stores urls that point to states of indeed.com, from which information can be extracted in the context of the key.
// Root defines the state from which the availible braches that can be explored are defined.
const urlMap = new Map([
  [
    "Root",
    "https://www.indeed.com/jobs?q=Software%20Engineer&l=New%20York%2C%20NY&vjk=94aeb151c39b9108",
  ],
  [
    "Java",
    "https://www.indeed.com/jobs?q=Software%20Engineer&l=New%20York%2C%20NY&taxo1=1X7zAik_RAWPuMD_To60Sg&vjk=15c206bf256238e8",
  ],
  [
    "Python",
    "https://www.indeed.com/jobs?q=Software%20Engineer&l=New%20York%2C%20NY&taxo1=8GQeqOBVSO2eVhu55t0BMg&vjk=0d5f29c20a3e7c03",
  ],
  [
    "Javascript",
    "https://www.indeed.com/jobs?q=Software%20Engineer&l=New%20York%2C%20NY&taxo1=oJHjzJOuQkapHAUg0sf0-Q&vjk=39fcb6dd569f465b",
  ],
  [
    "React",
    "https://www.indeed.com/jobs?q=Software%20Engineer&l=New%20York%2C%20NY&taxo1=G7qnOX5fQrO_ThMhs1Luog&vjk=63b29656a17138ba",
  ],
  [
    "C++",
    "https://www.indeed.com/jobs?q=Software%20Engineer&l=New%20York%2C%20NY&taxo1=Lj6PoGz2TaiI2iH954e2zA&vjk=57e19ea61a2f5313",
  ],
  [
    "SQL",
    "https://www.indeed.com/jobs?q=Software%20Engineer&l=New%20York%2C%20NY&taxo1=7stX-DmtS16eXxyIuIY47w&vjk=e2aacb9e44fa7209",
  ],
  [
    "C#",
    "https://www.indeed.com/jobs?q=Software%20Engineer&l=New%20York%2C%20NY&taxo1=6pwSVqu1S7SQobeP4fIE7Q&vjk=57e19ea61a2f5313",
  ],
  [
    "Node.js",
    "https://www.indeed.com/jobs?q=Software%20Engineer&l=New%20York%2C%20NY&taxo1=V4iFcJgUTK-R9MhOLH41Bw&vjk=8980ae6813122db6",
  ],
  [
    "Go",
    "https://www.indeed.com/jobs?q=Software%20Engineer&l=New%20York%2C%20NY&taxo1=vzoW1JNZSlOy6qIAa-Rg1Q&vjk=7d6cc82408475f77",
  ],
  [
    "CSS",
    "https://www.indeed.com/jobs?q=Software%20Engineer&l=New%20York%2C%20NY&taxo1=_Qk_PWgPQYWIpMowI17j4w&vjk=8980ae6813122db6",
  ],
  [
    "HTML5",
    "https://www.indeed.com/jobs?q=Software%20Engineer&l=New%20York%2C%20NY&taxo1=-gc_omGyRMS9UCrrnSwVPw&vjk=57e19ea61a2f5313",
  ],
  [
    "Typescript",
    "https://www.indeed.com/jobs?q=Software%20Engineer&l=New%20York%2C%20NY&taxo1=t1DKhTO0TyyLxNVZEJ--_A&vjk=398a6b198204cac3",
  ],
  [
    "Angular",
    "https://www.indeed.com/jobs?q=Software%20Engineer&l=New%20York%2C%20NY&taxo1=mZpfmuT0QhuFmpBK7P1wfw&vjk=7d1a26adc1d07586",
  ],
  [
    ".NET",
    "https://www.indeed.com/jobs?q=Software%20Engineer&l=New%20York%2C%20NY&taxo1=VWPkWxlYSM6iIiCPhqolsg&vjk=57e19ea61a2f5313",
  ],
  [
    "C",
    "https://www.indeed.com/jobs?q=Software%20Engineer&l=New%20York%2C%20NY&taxo1=GhDKjk0ET-yGCfhGCXe2xw&vjk=cefb5b0b1fee576e",
  ],
  [
    "Ruby",
    "https://www.indeed.com/jobs?q=Software%20Engineer&l=New%20York%2C%20NY&taxo1=XCvkqQa7TlSdWf6ITX92wg&vjk=cefb5b0b1fee576e",
  ],
  [
    "XML",
    "https://www.indeed.com/jobs?q=Software%20Engineer&l=New%20York%2C%20NY&taxo1=VpXF4_6oQl-wM_lyoIoydQ&vjk=102034b7df6be4cb",
  ],
  [
    "PHP",
    "https://www.indeed.com/jobs?q=Software%20Engineer&l=New%20York%2C%20NY&taxo1=BCst9M2uRaWCZBrRYzzxiA&vjk=7ff3b40fa467c628",
  ],
  [
    "Perl",
    "https://www.indeed.com/jobs?q=Software%20Engineer&l=New%20York%2C%20NY&taxo1=bjBQODjORfy4rlSgrph1wA&vjk=49f406ae8ad4e7b2",
  ],
]);

const pullListings = async (url: string, filtr: string): Promise<Map<string, number>> => {
  try {
    // Use axios client to make request.
    const { data } = await client.request({
      withCredentials: true,
      method: "GET",
      url: url,
      headers: {
        "user-agent": userAgent.toString(),
      },
    });

    if (data) {
      const listings = new Map<string, number>([]);
      const $ = cheerio.load(data);
      $(filtr).each((_, e) => {
        const myValue = $(e).text();
        const tempString = myValue.split(" ");
        tempString[1] = tempString[1].slice(1, -1);
        listings.set(tempString[0], parseInt(tempString[1]));
      });
      return listings;
    }
  } catch (e) {
    console.log(e);
    return new Map<string, number>([]);
  }
};

// pullAllListings pulls all listings
const pullAllListings = async () => {
  try {
    const trueListing = new Map<string, number>([]);
    //const current_url = new URL(urlMap.get("Root"));
    const scrapeResults = await pullListings(urlMap.get("Root"), filterMap.get("Root"));
    console.log(scrapeResults);
    await delay(getRandomInt(15000, 25000));
  } catch (err) {
    console.log(err);
  }
};
