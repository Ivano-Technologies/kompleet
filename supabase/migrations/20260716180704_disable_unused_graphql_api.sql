-- App uses PostgREST only; GraphQL API is unused. Dropping pg_graphql removes
-- the /graphql/v1 endpoint and clears all lint-0026/0027 schema-exposure warnings.
drop extension if exists pg_graphql;
