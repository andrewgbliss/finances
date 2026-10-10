# Next JS

Creat a new nextjs installation in the current directory. Accept all defaults.

Command:

```
npm create next-app@latest my-app --yes
```

## Drizzle

Command:

```
npm i drizzle-orm@rc pg dotenv
npm i -D drizzle-kit@rc tsx @types/pg
```

Create a sample.env with:

```
DATABASE_URL=
```

Create the rest of the typescript files outlined in the docs:

https://orm.drizzle.team/docs/get-started/postgresql-new

Add drizzle commands to the package.json db:push, db:generate, db:migrate

Create a simple users table to store Oauth tokens from Google Oauth. Be able to setup secret tokens. Dont store username or passwords.

## Docker

Create a docker-compose.yml file that has the postgres database. Use the env defaults and setup a localhost connection with a database called test-db

Don't have the folder sync to the local repo as in data/postgres.

## Shad CN

Install shad cn with defaults.

Command:

```
npx shadcn@latest init -t next
```

Add all components:

```
npx shadcn@latest add -all
```

## Create a front page

- Hero section
- App bar
- Back to Top button
- Dark Moddle Toggle Button
- About Section
- Location Section
- Footer with links

## Create a login page

- Using drizzle and the users table, create a login page with goole oauth. only store what is needed. no passwords or emails.
- Then create a user profile page that is behind the auth.

## Create a finances page

- show budget
- show income
- be able to enter in a edit fields in each
- have a table like spreadsheet to do my finances
