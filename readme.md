## Description:

This repository is a sample Shipping Connector as defined by the [v1 tech design](https://appdirect.jira.com/wiki/spaces/APPDEV/pages/456589480/APPD-1974+Shipping+Connector+API+tech+design) and the [Swagger doc](https://github.com/AppDirect/appdevices-api-docs/blob/master/rubicon/partner/shipping-connector/swagger.yaml).

It implements a shipping interface for UPS Parcel shipping.

This sample connector is intended to be used for demonstration only; production use is not recommended as it lacks many components of a production-ready application:

- automated testing
- continuous integration/deployment
- service hardening

Tracking updates are implemented using polling since UPS does not offer tracking webhooks. To overcome this, run `npm run tracking-update` regularly using cron or another scheduler.

## Dependencies

The Shipping Connector does not have any external dependencies other than UPS itself. It uses SQLite as a persistence layer, but this can be easily changed to use another RDBMS such as Postgres or MySQL.

## Installation

Clone the repository, then:

```
npm install
```

## Configuration

Shipping Connector is configured by the `default.js` file found in the `config/` directory.

Sensitive values are passed into the connector via environment variables. See `config/custom-environment-variables.js` to determine the mapping from env variables to config values.

## Usage

To run the connector API service in development mode:

```
npm run start
```

To run the Tracking Status update job:

```
npm run tracking-update
```
