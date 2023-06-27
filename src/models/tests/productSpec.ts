import { Product, ProductStore } from "../product";

describe('Product Model', () => {

    const store = new ProductStore();
    let testProduct:Product;

    beforeAll(async () => {
        // Setup initial state of the database
        testProduct = await store.create({
          name: 'Test Product',
          price: 100,
          category: 'Test Category'
        });
    });

    it('should have an index method', () => {
        expect(store.index).toBeDefined();
    });
    it('should have a show method', () => {
        expect(store.show).toBeDefined();
    })
    it('should have a create method', () => {
        expect(store.create).toBeDefined();
    })
    it('should have a delete method', () => {
        expect(store.delete).toBeDefined();
    })


    it('index method should return list of products', async () => {
        const products = await store.index();
        expect(Array.isArray(products)).toBe(true);
        expect(products.length).toBeGreaterThan(0);
    });

    it('should return a list of products from a specific category', async () => {
        const products = await store.index(testProduct.category);
        expect(Array.isArray(products)).toBe(true);
        expect(products).toContain(jasmine.objectContaining(testProduct));
    });

    it('should return a specific product', async () => {
        const product = await store.show(testProduct.id!);
        expect(product).toEqual(testProduct);
    });
    
    it('should create a new product', async () => {
        const product: Product = {
          name: 'Test Product 2',
          price: 200,
          category: 'Test Category 2'
        };
    
        const result = await store.create(product);
        expect(result).toEqual(jasmine.objectContaining(product));
    });

    it('should delete a product', async () => {
          // First, create a user
        const createProduct: Product = {
            name: 'Test Product 3',
            price: 200,
            category: 'Test Category 4'
        };
        const newProduct = await store.create(createProduct);
        expect(newProduct).toEqual(jasmine.objectContaining(createProduct));

        // Now, delete the user
        const deletedProduct = await store.delete(newProduct.id!);
        expect(deletedProduct).toEqual(newProduct);

        // Verify that the user no longer exists
        try {
            await store.show(newProduct.id!);
        } catch(err) {
            expect(err).toBeDefined();
        }
    });
})