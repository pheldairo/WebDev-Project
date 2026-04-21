from django.db import migrations


def seed_more_academic_slots(apps, schema_editor):
    AcademicSlot = apps.get_model('university', 'AcademicSlot')

    slots = [
        {
            'subject': 'Calculus II',
            'day': 'MON',
            'time_slot': '13:00-14:15',
            'teacher': 'Dr. Ethan Walker',
        },
        {
            'subject': 'Statistics for Engineers',
            'day': 'MON',
            'time_slot': '14:30-15:45',
            'teacher': 'Prof. Grace Hall',
        },
        {
            'subject': 'Object-Oriented Programming',
            'day': 'TUE',
            'time_slot': '13:00-14:15',
            'teacher': 'Dr. Noah Young',
        },
        {
            'subject': 'Database Systems',
            'day': 'TUE',
            'time_slot': '14:30-15:45',
            'teacher': 'Prof. Chloe King',
        },
        {
            'subject': 'Digital Logic Design',
            'day': 'WED',
            'time_slot': '13:00-14:15',
            'teacher': 'Dr. Liam Wright',
        },
        {
            'subject': 'Operating Systems',
            'day': 'WED',
            'time_slot': '14:30-15:45',
            'teacher': 'Prof. Ava Scott',
        },
        {
            'subject': 'Computer Networks',
            'day': 'THU',
            'time_slot': '13:00-14:15',
            'teacher': 'Dr. Mason Green',
        },
        {
            'subject': 'Artificial Intelligence',
            'day': 'THU',
            'time_slot': '14:30-15:45',
            'teacher': 'Prof. Ella Baker',
        },
        {
            'subject': 'Project Management',
            'day': 'FRI',
            'time_slot': '13:00-14:15',
            'teacher': 'Dr. Lucas Adams',
        },
        {
            'subject': 'Cybersecurity Fundamentals',
            'day': 'FRI',
            'time_slot': '14:30-15:45',
            'teacher': 'Prof. Harper Nelson',
        },
    ]

    for slot in slots:
        AcademicSlot.objects.get_or_create(
            subject=slot['subject'],
            day=slot['day'],
            time_slot=slot['time_slot'],
            teacher=slot['teacher'],
        )


def unseed_more_academic_slots(apps, schema_editor):
    AcademicSlot = apps.get_model('university', 'AcademicSlot')
    subjects = [
        'Calculus II',
        'Statistics for Engineers',
        'Object-Oriented Programming',
        'Database Systems',
        'Digital Logic Design',
        'Operating Systems',
        'Computer Networks',
        'Artificial Intelligence',
        'Project Management',
        'Cybersecurity Fundamentals',
    ]
    AcademicSlot.objects.filter(subject__in=subjects).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('university', '0004_seed_academic_slots'),
    ]

    operations = [
        migrations.RunPython(seed_more_academic_slots, unseed_more_academic_slots),
    ]
