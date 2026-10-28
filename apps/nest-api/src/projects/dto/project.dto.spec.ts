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
    title: 'Portfolio',
    description: 'My personal site',
    techStack: ['NestJS', 'PostgreSQL'],
    imageUrl: 'https://res.cloudinary.com/demo/image.png',
    githubUrl: 'https://github.com/me/portfolio',
    liveUrl: 'https://example.com',
    featured: true,
  };

  it('accepts a valid create body', async () => {
    expect(await errorFields(CreateProjectDto, valid)).toEqual([]);
  });

  it('requires title, description and techStack on create', async () => {
    expect(await errorFields(CreateProjectDto, {})).toEqual(
      expect.arrayContaining(['title', 'description', 'techStack']),
    );
  });

  it('rejects wrong types and bad URLs', async () => {
    const fields = await errorFields(CreateProjectDto, {
      ...valid,
      title: '',
      techStack: ['NestJS', 42],
      githubUrl: 'not-a-url',
      featured: 'yes',
    });
    expect(fields.sort()).toEqual(['featured', 'githubUrl', 'techStack', 'title']);
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
