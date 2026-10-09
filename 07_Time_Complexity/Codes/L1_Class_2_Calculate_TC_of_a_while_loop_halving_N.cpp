#include <iostream>
using namespace std;

int main() {
    int n = 64;
    int temp = n;
    int count = 0;

    while (temp > 1) {
        temp = temp / 2;
        count++;
    }

    cout << "N = " << n << endl;
    cout << "Halved " << count << " times to reach 1" << endl;
    cout << "64 = 2^6, so the loop runs log2(N) times: TC = O(log N)" << endl;
    return 0;
}
