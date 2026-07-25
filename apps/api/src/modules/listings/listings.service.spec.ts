import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Listing } from './entities/listing.entity';
import { ListingsService } from './listings.service';

describe('ListingsService', () => {
    let service: ListingsService;
    let repository: {
        createQueryBuilder: jest.Mock;
        findOne: jest.Mock;
        save: jest.Mock;
        create: jest.Mock;
        remove: jest.Mock;
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ListingsService,
                {
                    provide: getRepositoryToken(Listing),
                    useValue: {
                        createQueryBuilder: jest.fn(),
                        findOne: jest.fn(),
                        save: jest.fn(),
                        create: jest.fn(),
                        remove: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<ListingsService>(ListingsService);
        repository = module.get(getRepositoryToken(Listing));
    });

    it('filters listings by search term and paginates results', async () => {
        const queryBuilder = {
            select: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            orWhere: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            getManyAndCount: jest.fn().mockResolvedValue([[{ id: '1' }], 1]),
        };

        repository.createQueryBuilder.mockReturnValue(queryBuilder);

        const result = await service.findAll({ search: 'cattle', category: 'goat', page: 2, limit: 5 });

        expect(repository.createQueryBuilder).toHaveBeenCalledWith('listing');
        expect(queryBuilder.andWhere).toHaveBeenCalled();
        expect(queryBuilder.skip).toHaveBeenCalledWith(5);
        expect(queryBuilder.take).toHaveBeenCalledWith(5);
        expect(result.items).toHaveLength(1);
        expect(result.meta.total).toBe(1);
    });

    it('rejects updates to another seller\'s listing', async () => {
        repository.findOne.mockResolvedValue({ id: 'listing-1', sellerId: 'seller-2' });

        await expect(service.update('seller-1', 'listing-1', { title: 'Updated' } as any)).rejects.toThrow(ForbiddenException);
    });
});
