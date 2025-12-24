export interface User {
	userId: string;
	passwordHash: string;
	name: string;
	email: string;
	isActive: boolean;
	role: string;
}
export interface CreateUser {
	passwordHash: string;
	name: string;
	email: string;
    isActive: boolean;
	role: string;
}

export interface UpdateUser {
	passwordHash: string;
	name: string;
	email: string;
	isActive: boolean;
	role: string;
}
