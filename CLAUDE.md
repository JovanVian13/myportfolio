# myportfolio

Personal portfolio with its own CMS: a public site, a private admin panel, and a NestJS API they share.

## Layout

- `apps/nest-api`: NestJS 11 + Prisma 5 + PostgreSQL. The only app built so far.
- `apps/client`: public portfolio site (empty; planned Next.js).
- `apps/admin`: content management dashboard (empty).
- `docker-compose.yml`: Postgres + migrate job + API. **Written but not in use yet.**

## Working with me

- I'm using this project to learn. Explain the *why* behind NestJS/Prisma patterns, not just the code.
- When I say I'll build something myself (e.g. the skills module), don't implement it unless I ask; reviewing it is welcome.
- Don't commit unless I ask.

## Commands (run in `apps/nest-api`)

```bash
npm run start:dev          # API on :3000
npm test                   # unit tests (Prisma is mocked)
npx tsc --noEmit           # type-check
npx prisma studio          # browse/edit DB data
npx prisma generate        # after any schema change
```

Migrations: `prisma migrate dev` refuses to run in a non-interactive shell. Generate SQL with
`npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script`,
save it as `prisma/migrations/<timestamp>_<name>/migration.sql`, review it, then `npx prisma migrate deploy`.

## Database

- Local dev uses a locally installed Postgres via `apps/nest-api/.env` (db `myportfolio`, port 5432). This is intentional.
- The Docker Postgres (`portfolio_db`, host port 5433) is for later; don't treat the mismatch as a bug.

## API conventions (follow `src/projects` as the reference module)

- One module per resource: `*.module.ts`, `*.controller.ts` (HTTP only), `*.service.ts` (logic + Prisma), `dto/`.
- No entity classes: `schema.prisma` is the source of truth; use Prisma's generated types.
- DTOs use `class-validator`; a global `ValidationPipe` (whitelist + forbidNonWhitelisted + transform) is set in `main.ts`.
  Update DTOs are `PartialType(Create...Dto)`.
- Errors: missing record → `NotFoundException`; bad related IDs → `BadRequestException`;
  Prisma `P2002` (unique violation) → `ConflictException`.
- Ids are UUIDs, validated with `ParseUUIDPipe`. Public project pages use `slug`; writes use `id`.
- Relations: `skillIds: string[]` in DTOs → `connect` on create, `set` on update; read back with `include`.
- Drafts: public `GET`s filter `published: true`.
- Profile is a single row (`id = 1`): expose `GET` + `PUT` (upsert) only.
- Each service gets a spec with a mocked `PrismaService`.

## Roadmap

1. ✅ Projects CRUD (slug, drafts, skill relations)
2. Skills CRUD, grouped by category, ordered by `sortOrder` (skeleton exists in `src/skills`, I'm building it)
3. Experiences, Education, Profile modules
4. Seed script (`prisma/seed.ts`)
5. Client app (Next.js)
6. Auth (single admin, JWT; guard all writes), CORS, `@nestjs/config`, Cloudinary image uploads
7. Admin app
