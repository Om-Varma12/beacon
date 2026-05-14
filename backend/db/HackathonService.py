class HackathonService:
    def __init__(
        self,
        hackathon_repo,
        problem_repo,
    ):
        self.hackathon_repo = hackathon_repo
        self.problem_repo = problem_repo


    def get_hackathon_detail(self, hackathon_id: int):
        hackathon = self.hackathon_repo.get_by_id(hackathon_id)

        if not hackathon:
            return None
        
        print(hackathon)

        problems = self.problem_repo.get_by_hackathon_id(hackathon['id'])

        hackathon["problem_statements"] = problems

        return hackathon