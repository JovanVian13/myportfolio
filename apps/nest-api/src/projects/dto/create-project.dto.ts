export class CreateProjectDto {
  title!: string;
  description!: string;
  techStack!: string[];
  imageUrl?: string;
  githubUrl?: string;
  liveUrl?: string;
  featured?: boolean;
}