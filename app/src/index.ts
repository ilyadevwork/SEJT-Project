import axios from "axios";
import UserAgent from "user-agents";
import * as cheerio from "cheerio";
import "url";

// create client with timeout set
const client = new axios.Axios({
  timeout: 10000,
});

const userAgent = new UserAgent();

const pullListings = async (s: URL): Promise<string[]> => {
  try {
    // use client created earlier to pull html
    const { data } = await client.request({
      method: "GET",
      url: s.toString(),
      headers: {
        "user-agent": userAgent.toString(),
      },
    });

    if (data) {
      const listings: string[] = [];

      const $ = cheerio.load(data);
      $('div[id="mosaic-provider-jobcards"]')
        .children("a")
        .each((_, e) => {
          const link = $(e).attr("href");
          listings.push(`https://${s.hostname}${link}`);
        });

      return listings;
    }
  } catch (e) {
    console.log(e);
    return [];
  }
};

const page = new URL(
  "https://www.indeed.com/jobs?as_and=Software%20Engineer&as_phr&as_any&as_not&as_ttl&as_cmp&jt=all&st&salary&radius=25&l=New%20York%2C%20NY&fromage=any&limit=50&sort&psf=advsrch&from=advancedsearch&vjk=d30411f29f9d9423"
);

pullListings(page)
  .then(listingArray => {
    console.log(listingArray);
  })
  .catch(console.log);
