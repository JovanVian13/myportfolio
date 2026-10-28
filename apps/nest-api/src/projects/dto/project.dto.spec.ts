import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateProjectDto } from './create-project.dto';
import { UpdateProjectDto } from './update-project.dto';

const errorFields = async (cls: new () => object, body: object) => {
  const errors = await validate(plainToInstance(cls, body), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return errors.map((e) => e.property);
};

describe('Project DTOs', () => {
  const valid = {
    slug: 'my-portfolio',
    title: 'Portfolio',
    description: 'My personal site',
    skillIds: ['1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'],
    imageUrl: 'https://res.cloudinary.com/demo/image.png',
    githubUrl: 'https://github.com/me/portfolio',
    liveUrl: 'https://example.com',
    featured: true,
    published: false,
  };

  it('accepts a valid create body', async () => {
    expect(await errorFields(CreateProjectDto, valid)).toEqual([]);
  });

  it('requires slug, title, description and skillIds on create', async () => {
    expect(await errorFields(CreateProjectDto, {})).toEqual(
      expect.arrayContaining(['slug', 'title', 'description', 'skillIds']),
    );
  });

  it.each(['My-Portfolio', 'my portfolio', 'my--portfolio', '-portfolio'])(
    'rejects malformed slug "%s"',
    async (slug) => {
      expect(await errorFields(CreateProjectDto, { ...valid, slug })).toEqual([
        'slug',
      ]);
    },
  );

  it('rejects wrong types and bad URLs', async () => {
    const fields = await errorFields(CreateProjectDto, {
      ...valid,
      title: '',
      skillIds: ['not-a-uuid'],
      githubUrl: 'not-a-url',
      published: 'yes',
    });
    expect(fields.sort()).toEqual(['githubUrl', 'published', 'skillIds', 'title']);
  });

  it('rejects unknown fields', async () => {
    expect(await errorFields(CreateProjectDto, { ...valid, id: 'x' })).toEqual([
      'id',
    ]);
  });

  it('allows an empty or partial update body', async () => {
    expect(await errorFields(UpdateProjectDto, {})).toEqual([]);
    expect(await errorFields(UpdateProjectDto, { featured: false })).toEqual([]);
  });

  it('still validates fields that are sent on update', async () => {
    expect(await errorFields(UpdateProjectDto, { liveUrl: 'nope' })).toEqual([
      'liveUrl',
    ]);
  });
});
