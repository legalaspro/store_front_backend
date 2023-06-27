import { User, UserStore } from "../user";

describe('User Model', () => {

    const store = new UserStore();
    let testUser:User;
    const testUserPassword:string = 'HelloWorld';

    beforeAll(async () => {
        // Setup initial state of the database
        testUser = await store.create({
          email: "tester1@email.com",
          firstName: 'Tester',
          lastName: 'Smart 1',
          password: testUserPassword
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
    it('should have an authenticate method', () => {
        expect(store.authenticate).toBeDefined();
    })
   

    it('index method should return list of users', async () => {
        const users = await store.index();
        expect(Array.isArray(users)).toBe(true);
        expect(users.length).toBeGreaterThan(0);
    });

    it('should return a specific user', async () => {
        const user = await store.show(testUser.id!);
        expect(user).toEqual(testUser);
    });
    
    it('should create a new user', async () => {
        const user: User = {
          email: "tester2@email.com",
          firstName: 'Tester 2',
          lastName: 'Crazy',
          password: 'Kangaroo'
        };
    
        const result = await store.create(user);
        expect(result).toEqual(jasmine.objectContaining({
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
          }));
    });

    it('should delete a user', async () => {
      // First, create a user
      const user: User = {
          email: 'testdelete@email.com',
          password: 'password',
          firstName: 'John',
          lastName: 'Doe'
      };
      const newUser = await store.create(user);
      expect(newUser).toEqual(jasmine.objectContaining({
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName
      }));

      // Now, delete the user
      const deletedUser = await store.delete(newUser.id!);
      expect(deletedUser).toEqual(newUser);

      // Verify that the user no longer exists
      try {
          await store.show(newUser.id!);
      } catch(err) {
          expect(err).toBeDefined();
      }
    });

    it('should authenticate the user', async () => {
        const result = await store.authenticate(testUser.email, testUserPassword);
        expect(result).toEqual(jasmine.objectContaining({
          email: testUser.email,
          firstName: testUser.firstName,
          lastName: testUser.lastName
        }));
      });
    
    it('should return null if password is wrong', async () => {
        const result = await store.authenticate(testUser.email, "wrongPassword");
        expect(result).toBeNull();
    });
    
    it('should return null if user is not found', async () => {
      const result = await store.authenticate("notfound@email.com", "testPassword");
      expect(result).toBeNull();
    });
})