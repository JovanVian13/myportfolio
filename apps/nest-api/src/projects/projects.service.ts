import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

// Always return a project's skills in their display order
const includeSkills = {
  skills: { orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }] },
} satisfies Prisma.ProjectInclude;

@Injectable()
export class ProjectsService {
  // Injecting PrismaService via Dependency Injection
  constructor(private prisma: PrismaService) {}

  // Save a new project and link it to its skills
  async create(createProjectDto: CreateProjectDto) {
    const { skillIds, ...data } = createProjectDto;
    await this.assertSkillsExist(skillIds);

    return this.handleUniqueSlug(() =>
      this.prisma.project.create({
        data: {
          ...data,
          skills: { connect: skillIds.map((id) => ({ id })) },
        },
        include: includeSkills,
      }),
    );
  }

  // Public list: published projects only, featured ones pinned to the top
  async findAll() {
    return this.prisma.project.findMany({
      where: { published: true },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      include: includeSkills,
    });
  }

  // Public detail page, 404 for drafts as well as missing slugs
  async findBySlug(slug: string) {
    const project = await this.prisma.project.findFirst({
      where: { slug, published: true },
      include: includeSkills,
    });
    if (!project) {
      throw new NotFoundException(`Project "${slug}" not found`);
    }
    return project;
  }

  // Partially update a project; skillIds, if sent, replaces the whole tech stack
  async update(id: string, updateProjectDto: UpdateProjectDto) {
    const { skillIds, ...data } = updateProjectDto;
    await this.assertExists(id);
    if (skillIds) {
      await this.assertSkillsExist(skillIds);
    }

    return this.handleUniqueSlug(() =>
      this.prisma.project.update({
        where: { id },
        data: {
          ...data,
          ...(skillIds && {
            skills: { set: skillIds.map((id) => ({ id })) },
          }),
        },
        include: includeSkills,
      }),
    );
  }

  // Delete a project and return the removed record
  async remove(id: string) {
    await this.assertExists(id);
    return this.prisma.project.delete({ where: { id } });
  }

  private async assertExists(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException(`Project with id "${id}" not found`);
    }
  }

  // Turn unknown skill IDs into a 400 instead of a Prisma error
  private async assertSkillsExist(skillIds: string[]) {
    const uniqueIds = [...new Set(skillIds)];
    const found = await this.prisma.skill.count({
      where: { id: { in: uniqueIds } },
    });
    if (found !== uniqueIds.length) {
      throw new BadRequestException('One or more skillIds do not exist');
    }
  }

  // Turn a duplicate slug (Prisma error P2002) into a 409
  private async handleUniqueSlug<T>(query: () => Promise<T>) {
    try {
      return await query();
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A project with this slug already exists');
      }
      throw error;
    }
  }
}
