from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.core.exceptions import NotFoundException, AlreadyExistsException
from app.models.group import Group, GroupMember
from app.models.member import Member


class GroupService:
    @staticmethod
    def get_groups(db: Session, village_id: str) -> List[Dict]:
        groups = db.query(Group).filter(
            Group.village_id == village_id,
            Group.deleted_at.is_(None)
        ).all()

        if not groups:
            return []

        # N+1 FIX: Get all group members for all groups in ONE query
        group_ids = [g.id for g in groups]
        all_group_members = db.query(GroupMember).filter(
            GroupMember.group_id.in_(group_ids),
            GroupMember.deleted_at.is_(None)
        ).all()

        # N+1 FIX: Get all unique members in ONE query
        member_ids = list({gm.member_id for gm in all_group_members if gm.member_id})
        members_map = {
            m.id: m for m in db.query(Member).filter(
                Member.id.in_(member_ids),
                Member.deleted_at.is_(None)
            ).all()
        } if member_ids else {}

        # Group members by group_id
        members_by_group = {}
        for gm in all_group_members:
            members_by_group.setdefault(gm.group_id, []).append(gm)

        result = []
        for g in groups:
            gms = members_by_group.get(g.id, [])
            member_list = []
            for gm in gms:
                member = members_map.get(gm.member_id)
                if member:
                    member_list.append({
                        "id": str(member.id),
                        "name": member.full_name,
                        "phone": member.phone,
                        "role": member.role
                    })

            result.append({
                "id": str(g.id),
                "name": g.name,
                "description": g.description,
                "is_default": g.is_default,
                "member_count": len(member_list),
                "members": member_list
            })

        return result

    @staticmethod
    def get_group(db: Session, village_id: str, group_id: str) -> Dict:
        group = db.query(Group).filter(
            Group.id == group_id,
            Group.village_id == village_id,
            Group.deleted_at.is_(None)
        ).first()

        if not group:
            raise NotFoundException("Group")

        # N+1 FIX: Get members and member details in 2 queries total
        group_members = db.query(GroupMember).filter(
            GroupMember.group_id == group_id,
            GroupMember.deleted_at.is_(None)
        ).all()

        member_ids = [gm.member_id for gm in group_members if gm.member_id]
        members_map = {
            m.id: m for m in db.query(Member).filter(
                Member.id.in_(member_ids),
                Member.deleted_at.is_(None)
            ).all()
        } if member_ids else {}

        members = []
        for gm in group_members:
            member = members_map.get(gm.member_id)
            if member:
                members.append({
                    "id": str(member.id),
                    "name": member.full_name,
                    "phone": member.phone,
                    "role": member.role
                })

        return {
            "id": str(group.id),
            "name": group.name,
            "description": group.description,
            "is_default": group.is_default,
            "member_count": len(members),
            "members": members
        }

    @staticmethod
    def create_group(db: Session, village_id: str, data: dict, current_user_id: str) -> Dict:
        group = Group(
            village_id=village_id,
            name=data['name'],
            description=data.get('description'),
            created_by=current_user_id
        )

        db.add(group)
        db.commit()
        db.refresh(group)

        return {"id": str(group.id), "message": f"Group '{group.name}' created"}

    @staticmethod
    def update_group(db: Session, village_id: str, group_id: str, data: dict) -> Dict:
        group = db.query(Group).filter(
            Group.id == group_id,
            Group.village_id == village_id,
            Group.deleted_at.is_(None)
        ).first()

        if not group:
            raise NotFoundException("Group")

        for field, value in data.items():
            if value is not None and hasattr(group, field):
                setattr(group, field, value)

        db.commit()
        db.refresh(group)

        return {"message": f"Group '{group.name}' updated"}

    @staticmethod
    def delete_group(db: Session, village_id: str, group_id: str) -> Dict:
        group = db.query(Group).filter(
            Group.id == group_id,
            Group.village_id == village_id,
            Group.deleted_at.is_(None)
        ).first()

        if not group:
            raise NotFoundException("Group")

        group.soft_delete()
        db.commit()

        return {"message": f"Group '{group.name}' deleted"}

    @staticmethod
    def add_member_to_group(db: Session, group_id: str, member_id: str) -> Dict:
        # Check if already in group
        existing = db.query(GroupMember).filter(
            GroupMember.group_id == group_id,
            GroupMember.member_id == member_id,
            GroupMember.deleted_at.is_(None)
        ).first()

        if existing:
            raise AlreadyExistsException("Member already in this group")

        # Check if group exists
        group = db.query(Group).filter(
            Group.id == group_id,
            Group.deleted_at.is_(None)
        ).first()

        if not group:
            raise NotFoundException("Group")

        # Check if member exists
        member = db.query(Member).filter(
            Member.id == member_id,
            Member.deleted_at.is_(None)
        ).first()

        if not member:
            raise NotFoundException("Member")

        # Add member to group
        gm = GroupMember(group_id=group_id, member_id=member_id)
        db.add(gm)
        db.commit()

        return {"message": f"Member added to group '{group.name}'"}

    @staticmethod
    def remove_member_from_group(db: Session, group_id: str, member_id: str) -> Dict:
        gm = db.query(GroupMember).filter(
            GroupMember.group_id == group_id,
            GroupMember.member_id == member_id,
            GroupMember.deleted_at.is_(None)
        ).first()

        if not gm:
            raise NotFoundException("Member not in this group")

        gm.soft_delete()
        db.commit()

        return {"message": "Member removed from group"}
