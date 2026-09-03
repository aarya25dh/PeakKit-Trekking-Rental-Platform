from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from users.models import Profile


class Command(BaseCommand):
    help = 'Create missing Profile objects for users that do not have one'

    def handle(self, *args, **options):
        """Create profiles for all users without a profile."""
        created_count = 0
        users_without_profile = []

        # Find all users without a profile
        for user in User.objects.all():
            try:
                # Try to access the profile
                _ = user.profile
            except Profile.DoesNotExist:
                users_without_profile.append(user)

        # Create profiles for users without one
        for user in users_without_profile:
            Profile.objects.create(user=user)
            created_count += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Created profile for user: {user.email} ({user.username})'
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✓ Successfully created {created_count} profile(s).'
            )
        )
