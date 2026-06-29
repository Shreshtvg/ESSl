from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, name, password, role='Supervisor'):
        if not email:
            raise ValueError('Email is required')
        user = self.model(email=self.normalize_email(email), name=name, role=role)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password, role='Admin'):
        return self.create_user(email=email, name=name, password=password, role=role)


class User(AbstractBaseUser):
    ROLES = [('Admin', 'Admin'), ('Supervisor', 'Supervisor')]

    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLES, default='Supervisor')
    is_active = models.BooleanField(default=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name', 'role']

    objects = UserManager()

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f'{self.name} <{self.email}>'
