from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import AcademicSlot
from .serializers import AcademicSlotSerializer


class AcademicSlotListView(generics.ListAPIView):
    """
    Returns a list of all academic slots.
    """
    serializer_class = AcademicSlotSerializer
    permission_classes = [IsAuthenticated]
    queryset = AcademicSlot.objects.all()
