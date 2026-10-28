import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  // Injecting PrismaService via Dependency Injection
  constructor(private prisma: PrismaService) {}

  // Save a new project to PostgreSQL
  async create(createProjectDto: CreateProjectDto) {
    return this.prisma.project.create({
      data: createProjectDto,
    });
  }

  // Fetch all projects, featured ones pinned to the top
  async findAll() {
    return this.prisma.project.findMany({
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    });
  }

  // Fetch a single project, 404 if it doesn't exist
  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException(`Project with id "${id}" not found`);
    }
    return project;
  }

  // Partially update a project
  async update(id: string, updateProjectDto: UpdateProjectDto) {
    await this.findOne(id);
    return this.prisma.project.update({
      where: { id },
      data: updateProjectDto,
    });
  }

  // Delete a project and return the removed record
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.project.delete({ where: { id } });
  }
}
