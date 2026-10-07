from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = "Seed PeakKit with clean application dataset."

    def handle(self, *args, **options):
        call_command("reset_and_seed")
