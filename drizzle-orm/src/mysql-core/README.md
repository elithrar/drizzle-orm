<div align='center'>
<h1>Drizzle ORM | MySQL <a href=''><img alt='npm' src='https://img.shields.io/npm/v/drizzle-orm?label='></a></h1>
<img alt='npm' src='https://img.shields.io/npm/dm/drizzle-orm'>
<img alt='Driver version' src='https://img.shields.io/npm/dependency-version/drizzle-orm/peer/mysql2'>
<img alt='npm bundle size' src='https://img.shields.io/bundlephobia/min/drizzle-orm'>
<a href='https://discord.gg/yfjTbVXMW4'><img alt='Discord' src='https://img.shields.io/discord/1043890932593987624'></a>
<img alt='NPM' src='https://img.shields.io/npm/l/drizzle-orm'>
<h6><i>If you know SQL, you know Drizzle ORM</i></h6>
<hr />
</div>

Drizzle ORM is a TypeScript ORM for SQL databases designed with maximum type safety in mind. It comes with a [drizzle-kit](https://github.com/drizzle-team/drizzle-kit-mirror) CLI companion for automatic SQL migrations generation. This is the documentation for Drizzle ORM version for MySQL.

| Driver | Support |
| :- | :-: |
| [mysql2](https://github.com/sidorares/node-mysql2) | ✅ |
| [Planetscale Serverless](https://github.com/planetscale/database-js) | ✅ |

## Installation

```bash
# npm
npm i drizzle-orm mysql2
npm i -D drizzle-kit

# yarn
yarn add drizzle-orm mysql2
yarn add -D drizzle-kit

# pnpm
pnpm add drizzle-orm mysql2
pnpm add -D drizzle-kit
```

## SQL schema declaration

With `drizzle-orm` you declare SQL schema in TypeScript. You can have either one `schema.ts` file with all declarations or you can group them logically in multiple files. We prefer to use single file schema.

### Single schema file example

```plaintext
📦 <project root>
 └ 📂 src
    └ 📂 db
       └ 📜schema.ts
```

### Multiple schema files example

```plaintext
📦 <project root>
 └ 📂 src
    └ 📂 db
       └ 📂 schema
          ├ 📜users.ts
          ├ 📜countries.ts
          ├ 📜cities.ts
          ├ 📜products.ts
          ├ 📜clients.ts
          ├ 📜enums.ts
          └ 📜etc.ts
```

## Quick start

```typescript
// schema.ts
export const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  fullName: text('full_name'),
  phone: varchar('phone', { length: 256 }),
});
```

### Connect using mysql2 Pool (recommended)

```typescript
// db.ts
import { drizzle } from 'drizzle-orm/mysql2';

import mysql from 'mysql2/promise';
import { users } from './schema';

// create the connection
const poolConnection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'test',
});

const db = drizzle(poolConnection);

const allUsers = await db.select().from(users);
```

### Connect using mysql2 Client

```typescript
// db.ts
import { drizzle } from 'drizzle-orm/mysql2';

import mysql from 'mysql2/promise';
import { users } from './schema';

// create the connection
const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'test',
});

const db = drizzle(connection);

const allUsers = await db.select().from(users);
```

### Connect using PlanetScale Serverless client

```typescript
// db.ts
import { drizzle } from 'drizzle-orm/planetscale-serverless';

import { connect } from '@planetscale/database';
import { users } from './schema';

// create the connection
const connection = connect({
  host: process.env['DATABASE_HOST'],
  username: process.env['DATABASE_USERNAME'],
  password: process.env['DATABASE_PASSWORD'],
});

const db = drizzle(connection);

const allUsers = await db.select().from(users);
```

## Schema declaration

This is how you declare SQL schema in `schema.ts`. You can declare tables, indexes and constraints, foreign keys and enums. Please pay attention to `export` keyword, they are mandatory if you'll be using [drizzle-kit SQL migrations generator](#migrations).

```typescript
// db.ts
import {
  int,
  mysqlEnum,
  mysqlTable,
  serial,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';

// declaring enum in database
export const countries = mysqlTable('countries', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }),
}, (countries) => ({
  nameIndex: uniqueIndex('name_idx').on(countries.name),
}));

export const cities = mysqlTable('cities', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }),
  countryId: int('country_id').references(() => countries.id),
  popularity: mysqlEnum('popularity', ['unknown', 'known', 'popular']),
});
```

### Database and table entity types

```typescript
// db.ts
import { InferModel, MySqlDatabase, MySqlRawQueryResult, mysqlTable, serial, text, varchar } from 'drizzle-orm/mysql-core';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';

const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  fullName: text('full_name'),
  phone: varchar('phone', { length: 256 }),
});

export type User = InferModel<typeof users>; // return type when queried
export type NewUser = InferModel<typeof users, 'insert'>; // insert type
...

// init mysql2 Pool or Client
const poolConnection = mysql.createPool({
    host:'localhost', 
    user: 'root',
    database: 'test'
});

export const db: MySqlDatabase = drizzle(poolConnection);

const result: User[] = await db.select().from(users);

/* type MySqlRawQueryExample is a response from mysql2 driver
   type MySqlRawQueryResult = [ResultSetHeader, FieldPacket[]];
   type ResultSetHeader = {
      affectedRows: number;
      fieldCount: number;
      info: string;
      insertId: number;
      serverStatus: number;
      warningStatus: number;
      changedRows?: number;
    }
*/
export async function insertUser(user: NewUser): Promise<MySqlRawQueryResult> {
  return db.insert(users).values(user);
}
```

### Declaring indexes, foreign keys and composite primary keys

```typescript
// db.ts
import { foreignKey, index, int, mysqlTable, serial, uniqueIndex, varchar } from 'drizzle-orm/mysql-core';

export const countries = mysqlTable('countries', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 256 }),
    population: int('population'),
  }, (table) => ({
    nameIdx: index('name_idx').on(table.name), // one column
    namePopulationIdx: index('name_population_idx').on(table.name, table.population), // multiple columns
    uniqueIdx: uniqueIndex('unique_idx').on(table.name), // unique index
  })
);

export const cities = mysqlTable('cities', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }),
  countryId: int('country_id').references(() => countries.id), // inline foreign key
  countryName: varchar('country_id', { length: 256 }),
}, (cities) => ({
  // explicit foreign key with 1 column
  countryFk: foreignKey(({
    columns: [cities.countryId],
    foreignColumns: [countries.id],
  })),
  // explicit foreign key with multiple columns
  countryIdNameFk: foreignKey(({
    columns: [cities.countryId, cities.countryName],
    foreignColumns: [countries.id, countries.name],
  })),
}));

export const cpkTable = mysqlTable('table', {
  simple: int('simple'),
  columnNotNull: int('column_not_null').notNull(),
  columnDefault: int('column_default').default(100),
}, (table) => ({
  cpk: primaryKey(table.simple, table.columnDefault),
}));

// Index declaration reference
index('name_idx')
    .on(table.column1, table.column2, ...)
    .using('btree' | 'hash')
    .lock('default' | 'none' | 'shared' | 'exclusive')
    .algorythm('default' | 'inplace' | 'copy')
```

## Column types

The list of all column types. You can also create custom types - [see here](https://github.com/drizzle-team/drizzle-orm/blob/main/docs/custom-types.md).

```typescript
mysqlEnum('popularity', ['unknown', 'known', 'popular'])

int('...');
tinyint('name');
smallint('name');
mediumint('name');
bigint('...', { mode: 'number' });

real('name', { precision: 1, scale: 1 });
decimal('name', { precision: 1, scale: 1 });
double('name', { precision: 1, scale: 1 });
float('name',);

serial('name');

binary('name');
varbinary('name', { length: 2 });

char('name');
varchar('name', { length: 2 });
text('name');

boolean('name');

date('...');
datetime('...', { mode: 'date' | 'string', fsp: 0..6 });
time('...', { mode: 'date' | 'string', fsp: 0..6 });
year('...');

timestamp('name');
timestamp('...', { mode: 'date' | 'string', fsp: 0..6 })
timestamp('...').defaultNow()

json('name');
json<string[]>('name');

int('...').array(3).array(4)
```

## Table schemas

> **Warning**
> If you have tables with same names in different schemas, Drizzle will set result types to `never[]` and return an error from the database.
>
> In this case you may use [alias syntax](/drizzle-orm/src/mysql-core/README.md#join-aliases-and-self-joins).

---

Usage example

```typescript
// Table in default schema
const publicUsersTable = mysqlTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  verified: boolean('verified').notNull().default(false),
  jsonb: json<string[]>('jsonb'),
  createdAt: timestamp('created_at', { fsp: 2 }).notNull().defaultNow(),
});

// Table in custom schema
const mySchema = mysqlSchema('mySchema');

const mySchemaUsersTable = mySchema('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  verified: boolean('verified').notNull().default(false),
  jsonb: json<string[]>('jsonb'),
  createdAt: timestamp('created_at', { fsp: 2 }).notNull().defaultNow(),
});
```

## Select, Insert, Update, Delete

### Select

Querying, sorting and filtering. We also support partial select.

```typescript
...
import { mysqlTable, serial, text, varchar } from 'drizzle-orm/mysql-core';
import { drizzle } from 'drizzle-orm/mysql2';
import { and, asc, desc, eq, or } from 'drizzle-orm/expressions';

const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  name: text('full_name'),
});

const db = drizzle(...);

await db.select().from(users);
await db.select().from(users).where(eq(users.id, 42));

// you can combine filters with and(...) / or(...)
await db.select().from(users).where(and(eq(users.id, 42), eq(users.name, 'Dan')));

await db.select().from(users)
  .where(or(eq(users.id, 42), eq(users.id, 1)));

// partial select
const result = await db
  .select({
    mapped1: users.id,
    mapped2: users.name,
  })
  .from(users);
const { mapped1, mapped2 } = result[0];

// limit, offset & order by
await db.select().from(users).limit(10).offset(10);
await db.select().from(users).orderBy(users.name);
await db.select().from(users).orderBy(desc(users.name));
// you can pass multiple order args
await db.select().from(users).orderBy(asc(users.name), desc(users.name));
```

#### Conditionally select fields

```typescript
async function selectUsers(withName: boolean) {
  return db
    .select({
      id: users.id,
      ...(withName ? { name: users.name } : {}),
    })
    .from(users);
}

const users = await selectUsers(true);
```

#### WITH clause

```typescript
const sq = db.select().from(users).where(eq(users.id, 42)).prepareWithSubquery('sq');
const result = await db.with(sq).select().from(sq);
```

> **Note**: Keep in mind, that if you need to select raw `sql` in a WITH subquery and reference that field in other queries, you must add an alias to it:

```typescript
const sq = db
  .select({
    name: sql<string>`upper(${users.name})`.as('name'),
  })
  .from(users)
  .prepareWithSubquery('sq');

const result = await db
  .select({
    name: sq.name,
  })
  .from(sq);
```

Otherwise, the field type will become `DrizzleTypeError` and you won't be able to reference it in other queries. If you ignore the type error and still try to reference the field, you will get a runtime error, because we cannot reference that field without an alias.

#### Select from subquery

```typescript
const sq = db.select().from(users).where(eq(users.id, 42)).as('sq');
await db.select().from(sq);
```

Subqueries in joins are supported, too:

```typescript
await db.select().from(users).leftJoin(sq, eq(users.id, sq.id));
```

#### List of all filter operators

```typescript
eq(column, value)
eq(column1, column2)
ne(column, value)
ne(column1, column2)

notEq(column, value)
less(column, value)
lessEq(column, value)

gt(column, value)
gt(column1, column2)
gte(column, value)
gte(column1, column2)
lt(column, value)
lt(column1, column2)
lte(column, value)
lte(column1, column2)

isNull(column)
isNotNull(column)

inArray(column, values[])
inArray(column, sqlSubquery)
notInArray(column, values[])
notInArray(column, sqlSubquery)

exists(sqlSubquery)
notExists(sqlSubquery)

between(column, min, max)
notBetween(column, min, max)

like(column, value)
like(column, value)
ilike(column, value)
notIlike(column, value)

not(sqlExpression)

and(...expressions: SQL[])
or(...expressions: SQL[])

```

### Insert

```typescript
import { mysqlTable, serial, text, timestamp, InferModel } from 'drizzle-orm/mysql-core';
import { drizzle } from 'drizzle-orm/mysql2';

const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  name: text('name'),
  createdAt: timestamp('created_at'),
});

type NewUser = InferModel<typeof users>;

const db = drizzle(...);

await db.insert(users)
  .values({
    name: 'Andrew',
    createdAt: new Date(),
  });

// accepts vararg of items
await db.insert(users)
  .values(
    {
      name: 'Andrew',
      createdAt: new Date(),
    },
    {
      name: 'Dan',
      createdAt: new Date(),
    },
  );

const newUsers: NewUser[] = [
  {
      name: 'Andrew',
      createdAt: new Date(),
  },
  {
    name: 'Dan',
    createdAt: new Date(),
  },
];

await db.insert(users).values(...newUsers);
```

### Update and Delete

```typescript
await db.update(users)
  .set({ name: 'Mr. Dan' })
  .where(eq(users.name, 'Dan'));

await db.delete(users)
  .where(eq(users.name, 'Dan'));
```

### Joins

Last but not least. Probably the most powerful feature in the library🚀

> **Note**: for in-depth partial select joins documentation, refer to [this page](/docs/joins.md).

#### Many-to-one

```typescript
const cities = mysqlTable('cities', {
  id: serial('id').primaryKey(),
  name: text('name'),
});

const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  name: text('name'),
  cityId: int('city_id').references(() => cities.id),
});

const result = db.select().from(cities).leftJoin(users, eq(cities2.id, users2.cityId));
```

#### Many-to-many

```typescript
const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  name: text('name'),
});

const chatGroups = mysqlTable('chat_groups', {
  id: serial('id').primaryKey(),
  name: text('name'),
});

const usersToChatGroups = mysqlTable('usersToChatGroups', {
  userId: integer('user_id').notNull().references(() => users.id),
  groupId: integer('group_id').notNull().references(() => chatGroups.id),
});

// querying user group with id 1 and all the participants(users)
const result = await db
  .select()
  .from(usersToChatGroups)
  .leftJoin(users, eq(usersToChatGroups.userId, users.id))
  .leftJoin(chatGroups, eq(usersToChatGroups.groupId, chatGroups.id))
  .where(eq(chatGroups.id, 1));
```

#### Join aliases and self-joins

```typescript
import { ..., alias } from 'drizzle-orm/mysql-core';

export const files = mysqlTable('folders', {
  name: text('name').notNull(),
  parent: text('parent_folder')
})

const nestedFiles = alias(files, 'nested_files');

// will return files and folders and nested files for each folder at root dir
const result = await db
  .select()
  .from(files)
  .leftJoin(nestedFiles, eq(files.name, nestedFiles.name))
  .where(eq(files.parent, '/'));
```

#### Join using partial select

```typescript
// Select user ID and city ID and name
const result1 = await db
  .select({
    userId: users.id,
    cityId: cities.id,
    cityName: cities.name,
  })
  .from(cities).leftJoin(users, eq(users.cityId, cities.id));

// Select all fields from users and only id and name from cities
const result2 = await db
  .select({
    user: users,
    city: {
      id: cities.id,
      name: cities.name,
    },
  })
  .from(cities).leftJoin(users, eq(users.cityId, cities.id));
```

## Prepared statements

```typescript
const query = db.select().from(users).where(eq(users.name, 'Dan')).prepare();

const result = await query.execute();
```

### Prepared statements with parameters

```typescript
import { placeholder } from 'drizzle-orm/mysql-core';

const query = db.select().from(users).where(eq(users.name, placeholder('name'))).prepare();

const result = await query.execute({ name: 'Dan' });
```

## Raw queries execution

If you have some complex queries to execute and drizzle-orm can't handle them yet, you can use the `db.execute` method to execute raw queries.

```typescript
// it will automatically run a parametrized query!
const res: MySqlQueryResult<{ id: number; name: string }> = await db.execute<
  { id: number; name: string }
>(sql`select * from ${users} where ${users.id} = ${userId}`);
```

## Migrations

### Automatic SQL migrations generation with drizzle-kit

[DrizzleKit](https://www.npmjs.com/package/drizzle-kit) - is a CLI migrator tool for DrizzleORM. It is probably one and only tool that lets you completely automatically generate SQL migrations and covers ~95% of the common cases like deletions and renames by prompting user input.

Check out the [docs for DrizzleKit](https://github.com/drizzle-team/drizzle-kit-mirror)

For schema file:

```typescript
import { index, integer, mysqlTable, serial, varchar } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  fullName: varchar('full_name', { length: 256 }),
}, (users) => ({
  nameIdx: index('name_idx').on(users.fullName),
}));

export const authOtps = mysqlTable('auth_otp', {
  id: serial('id').primaryKey(),
  phone: varchar('phone', { length: 256 }),
  userId: int('user_id').references(() => users.id),
});
```

It will generate:

```SQL
CREATE TABLE `users` (
 `id` int PRIMARY KEY,
 `full_name` varchar(256)
);


CREATE TABLE `auth_otp` (
 `id` serial PRIMARY KEY,
 `phone` varchar(256),
 `user_id` int
);


ALTER TABLE auth_otp ADD CONSTRAINT auth_otp_user_id_users_id_fk FOREIGN KEY (`user_id`) REFERENCES users(`id`) ;
CREATE INDEX name_idx ON users (`full_name`);
```

And you can run migrations manually or using our embedded migrations module

```typescript
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import mysql from 'mysql2/promise';

// create the connection
const poolConnection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'test',
  multipleStatements: true,
});

const db = drizzle(poolConnection);

// this will automatically run needed migrations on the database
await migrate(db, { migrationsFolder: './drizzle' });
```

## Logging

To enable default query logging, just pass `{ logger: true }` to the `drizzle` function:

```typescript
import { drizzle } from 'drizzle-orm/mysql2';

const db = drizzle(pool, { logger: true });
```

You can change the logs destination by creating a `DefaultLogger` instance and providing a custom `writer` to it:

```typescript
import { DefaultLogger, LogWriter } from 'drizzle-orm/logger';
import { drizzle } from 'drizzle-orm/mysql2';

class MyLogWriter implements LogWriter {
  write(message: string) {
    // Write to file, console, etc.
  }
}

const logger = new DefaultLogger({ writer: new MyLogWriter() });

const db = drizzle(pool, { logger });
```

You can also create a custom logger:

```typescript
import { Logger } from 'drizzle-orm/logger';
import { drizzle } from 'drizzle-orm/mysql2';

class MyLogger implements Logger {
  logQuery(query: string, params: unknown[]): void {
    console.log({ query, params });
  }
}

const db = drizzle(pool, { logger: new MyLogger() });
```

## Table introspect API

See [dedicated docs](/docs/table-introspect-api.md).
