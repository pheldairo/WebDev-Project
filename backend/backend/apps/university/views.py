from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import AcademicSlot
from .serializers import AcademicSlotSerializer


class AcademicSlotListView(generics.ListAPIView):
    """
    Returns a list of academic slots filtered by the user's major and semester.
    """
    serializer_class = AcademicSlotSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = AcademicSlot.objects.all()
        
        # Filter by user's major and semester if available
        if user.major:
            queryset = queryset.filter(course__major=user.major)
        
        if hasattr(user, 'semester'):
            queryset = queryset.filter(course__semester=user.semester)
            
        return queryset
