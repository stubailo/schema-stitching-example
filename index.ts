import * as express from 'express';
import * as bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { makeRemoteExecutableSchema, mergeSchemas } from 'graphql-tools';
import { createApolloFetch } from 'apollo-fetch';

async function run() {
  const firstSchema = makeRemoteExecutableSchema(createApolloFetch({
    uri: 'https://www.universe.com/graphql/beta',
  }));

  const secondSchema = makeRemoteExecutableSchema(createApolloFetch({
    uri: 'https://5rrx10z19.lp.gql.zone/graphql',
  }));

  const [universeSchema, weatherSchema] = await Promise.all([firstSchema, secondSchema]);

  const schema = mergeSchemas({
    schemas: [universeSchema, weatherSchema],
    links: [
      {
        name: 'location',
        from: 'Event',
        to: 'location',
        resolveArgs: parent => ({ place: parent.cityName }),
        fragment: `
          fragment WeatherLocationArgs on Event {
            cityName
          }
        `,
      },
    ],
  });

  const app = express();

  app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));

  app.use(
    '/graphiql',
    graphiqlExpress({
      endpointURL: '/graphql',
      query: `query {
  event(id: "5983706debf3140039d1e8b4") {
    title
    description
    url
    location {
      city
      country
      weather {
        summary
        temperature
      }
    }
  }
}
      `,
    })
  );

  app.listen(3000);
  console.log('Server running. Open http://localhost:3000/graphiql to run queries.');
}

try {
  run();
} catch (e) {
  console.log(e, e.message, e.stack);
}
