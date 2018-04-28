const cheerio = require('cheerio');
const dateFormat = require('dateformat');
const puppeteer = require('puppeteer');
const { ALERT_TYPES } = require('../constants.js');

async function getPriceForFlight ({ from, to, date, number, alertType }) {
  const flights = (await getFlights({
    from,
    to,
    departDate: dateFormat(date, 'mm/dd/yyyy', true)
  })).outbound;

  let options;
  if (alertType === ALERT_TYPES.SINGLE) {
    options = flights.filter(f => f.number === number);
  } else if (alertType === ALERT_TYPES.DAY) {
    options = flights;
  } else if (alertType === ALERT_TYPES.RANGE) {
    return;
  }
  const prices = options.map(f => f.price);
  console.log(Math.min(...prices));
  return Math.min(...prices);
}

async function getFlights ({ from, to, departDate, returnDate }) {
  const twoWay = Boolean(departDate && returnDate);
  const params = {
    twoWayTrip: twoWay,
    airTranRedirect: '',
    returnAirport: twoWay ? 'RoundTrip' : '',
    outboundTimeOfDay: 'ANYTIME',
    returnTimeOfDay: 'ANYTIME',
    seniorPassengerCount: 0,
    fareType: 'DOLLARS',
    originAirport: from,
    destinationAirport: to,
    outboundDateString: departDate,
    returnDateString: returnDate || '',
    adultPassengerCount: 1
  };

  const paramsUpdated = {
    from: from,
    to: to,

  };

  const fares = { outbound: [] };

  if (twoWay) fares.return = [];

  const html = await getPage(from, to, departDate, returnDate);
  const $ = cheerio.load(html);

  const departingFlights = $(`#air-booking-product-0 > div > ul > li.air-booking-select-detail`);
  if (departingFlights.length) {
    departingFlights.toArray().forEach(e => parseTrip(e, fares.outbound));
  }

  if (twoWay) {
    const returningFlights = $(`#air-booking-product-1 > div > ul > li.air-booking-select-detail`);
    if (returningFlights.length) {
      returningFlights.toArray().forEach(e => parseTrip(e, fares.return));
    }
  }

  return fares;

  function parseTrip (e, dest, international = false) {
    const str = $(e).attr(international ? 'aria-label' : 'title')
      .replace(/\u200B/g, '')
      .replace(/\u00A0/g, ' ');
    console.log('------------------ New trip price ---------------');
    console.log('String: ', str);

    const flights_ = str.match(/flight ([^\s]+)/);
    const flights = flights_[1].split('/').join(',');
    console.log('flights: ', flights);

    const stops_ = str.match(/arrive (\w+)/);
    const stops = stops_[1] === 'Nonstop' ? 0 : parseInt(stops_[1], 10);
    console.log('stops: ', stops);

    const priceStr = $(e).siblings(international ? '.var.h5' : '.product_price').text().trim();

    const price_ = priceStr.match(/\$(\d+)/);
    let price = Infinity;
    if (price_ != null) {
      price = parseInt(price_[1], 10);
    }

    dest.push({
      number: flights,
      stops,
      price
    });
  }
}

async function getPage (from, to, departDate, returnDate) {
  return new Promise(resolve => {
    puppeteer.launch().then(async browser => {
      const page = await browser.newPage();
      await page.goto("https://www.southwest.com/flight/?int=HOME-BOOKING-WIDGET-ADVANCED-AIR/")

      await page.click("[value=oneway]")
      await page.type('#originationAirportCode', from);
      await page.type('#destinationAirportCode', to);
      await page.type('#departureDate', departDate);
      await page.type('#adultPassengersCount', '1');
      await page.type('#seniorPassengersCount', '0');
      await page.click("#form-mixin--submit-button");
    
      await page.waitForSelector(".price-matrix--details-titles");
      const html = await page.evaluate(() => document.body.outerHTML);
      await browser.close();

      resolve(html.toString());
    });
  });
}

module.exports = {
  getPriceForFlight,
  getFlights
};
