import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePostDto, PostResponseDto } from './posts.dto';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  findAll(): Promise<PostResponseDto[]> {
    return this.postsService.findAll();
  }

  @Get('top')
  getTopPosts(): Promise<PostResponseDto[]> {
    return this.postsService.getTopPosts();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<PostResponseDto> {
    return this.postsService.findOne(id);
  }

  @Post()
  create(@Body() body: CreatePostDto): Promise<PostResponseDto> {
    return this.postsService.create(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/vote')
  vote(
    @Param('id') id: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Req() req: any,
  ): Promise<PostResponseDto> {
    const userId: string = req.user.id;
    return this.postsService.vote(id, userId);
  }
}
