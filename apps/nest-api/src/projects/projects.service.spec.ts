import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  const prisma = {
    project: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const id = '8f14e45f-ceea-4e7a-9b1c-2a1d3c4b5e6f';
  const project = { id, title: 'Portfolio', featured: false };

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

  it('findAll pins featured projects first', async () => {
    prisma.project.findMany.mockResolvedValue([project]);
    await expect(service.findAll()).resolves.toEqual([project]);
    expect(prisma.project.findMany).toHaveBeenCalledWith({
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    });
  });

  it('findOne returns the project', async () => {
    prisma.project.findUnique.mockResolvedValue(project);
    await expect(service.findOne(id)).resolves.toEqual(project);
  });

  it('findOne throws NotFoundException when missing', async () => {
    prisma.project.findUnique.mockResolvedValue(null);
    await expect(service.findOne(id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update applies the partial data', async () => {
    prisma.project.findUnique.mockResolvedValue(project);
    prisma.project.update.mockResolvedValue({ ...project, featured: true });
    await expect(service.update(id, { featured: true })).resolves.toEqual({
      ...project,
      featured: true,
    });
    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id },
      data: { featured: true },
    });
  });

  it('update throws NotFoundException when missing', async () => {
    prisma.project.findUnique.mockResolvedValue(null);
    await expect(service.update(id, { featured: true })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.project.update).not.toHaveBeenCalled();
  });

  it('remove deletes the project', async () => {
    prisma.project.findUnique.mockResolvedValue(project);
    prisma.project.delete.mockResolvedValue(project);
    await expect(service.remove(id)).resolves.toEqual(project);
    expect(prisma.project.delete).toHaveBeenCalledWith({ where: { id } });
  });

  it('remove throws NotFoundException when missing', async () => {
    prisma.project.findUnique.mockResolvedValue(null);
    await expect(service.remove(id)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.project.delete).not.toHaveBeenCalled();
  });
});
