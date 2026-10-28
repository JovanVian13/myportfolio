import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  const prisma = {
    project: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    skill: {
      count: jest.fn(),
    },
  };

  const id = '8f14e45f-ceea-4e7a-9b1c-2a1d3c4b5e6f';
  const skillId = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
  const project = { id, slug: 'portfolio', title: 'Portfolio', skills: [] };
  const createDto = {
    slug: 'portfolio',
    title: 'Portfolio',
    description: 'My site',
    skillIds: [skillId],
  };
  const uniqueError = new Prisma.PrismaClientKnownRequestError('Unique', {
    code: 'P2002',
    clientVersion: 'test',
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('connects the given skills', async () => {
      prisma.skill.count.mockResolvedValue(1);
      prisma.project.create.mockResolvedValue(project);
      await expect(service.create(createDto)).resolves.toEqual(project);
      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            slug: 'portfolio',
            title: 'Portfolio',
            description: 'My site',
            skills: { connect: [{ id: skillId }] },
          },
        }),
      );
    });

    it('rejects unknown skillIds with 400', async () => {
      prisma.skill.count.mockResolvedValue(0);
      await expect(service.create(createDto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.project.create).not.toHaveBeenCalled();
    });

    it('turns a duplicate slug into 409', async () => {
      prisma.skill.count.mockResolvedValue(1);
      prisma.project.create.mockRejectedValue(uniqueError);
      await expect(service.create(createDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  it('findAll returns only published projects, featured first', async () => {
    prisma.project.findMany.mockResolvedValue([project]);
    await expect(service.findAll()).resolves.toEqual([project]);
    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { published: true },
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      }),
    );
  });

  describe('findBySlug', () => {
    it('returns the published project', async () => {
      prisma.project.findFirst.mockResolvedValue(project);
      await expect(service.findBySlug('portfolio')).resolves.toEqual(project);
      expect(prisma.project.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { slug: 'portfolio', published: true } }),
      );
    });

    it('throws NotFoundException for missing or draft projects', async () => {
      prisma.project.findFirst.mockResolvedValue(null);
      await expect(service.findBySlug('draft')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('leaves skills alone when skillIds is not sent', async () => {
      prisma.project.findUnique.mockResolvedValue(project);
      prisma.project.update.mockResolvedValue({ ...project, featured: true });
      await service.update(id, { featured: true });
      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id }, data: { featured: true } }),
      );
      expect(prisma.skill.count).not.toHaveBeenCalled();
    });

    it('replaces the skills when skillIds is sent', async () => {
      prisma.project.findUnique.mockResolvedValue(project);
      prisma.skill.count.mockResolvedValue(1);
      prisma.project.update.mockResolvedValue(project);
      await service.update(id, { skillIds: [skillId] });
      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { skills: { set: [{ id: skillId }] } },
        }),
      );
    });

    it('throws NotFoundException when missing', async () => {
      prisma.project.findUnique.mockResolvedValue(null);
      await expect(service.update(id, { featured: true })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.project.update).not.toHaveBeenCalled();
    });

    it('turns a duplicate slug into 409', async () => {
      prisma.project.findUnique.mockResolvedValue(project);
      prisma.project.update.mockRejectedValue(uniqueError);
      await expect(service.update(id, { slug: 'taken' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('deletes the project', async () => {
      prisma.project.findUnique.mockResolvedValue(project);
      prisma.project.delete.mockResolvedValue(project);
      await expect(service.remove(id)).resolves.toEqual(project);
      expect(prisma.project.delete).toHaveBeenCalledWith({ where: { id } });
    });

    it('throws NotFoundException when missing', async () => {
      prisma.project.findUnique.mockResolvedValue(null);
      await expect(service.remove(id)).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.project.delete).not.toHaveBeenCalled();
    });
  });
});
