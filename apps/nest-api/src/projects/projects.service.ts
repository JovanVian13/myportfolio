import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';

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

  // Fetch all projects from PostgreSQL
  async findAll() {
    return this.prisma.project.findMany({
      orderBy: {
        createdAt: 'desc', // Show newest projects first
      },
    });
  }
}